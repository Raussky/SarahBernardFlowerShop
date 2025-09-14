import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { record: incomingOrder } = await req.json();

    if (incomingOrder.status !== "cancelled") {
      return new Response("Order status not 'cancelled', skipping.", {
        status: 200,
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Fetch the full order details from the database to ensure we have all fields
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", incomingOrder.id)
      .single();

    if (error) {
      throw new Error(`Error fetching order details: ${error.message}`);
    }

    const fullAddress = order.customer_address || "Адрес не указан";
    const phone = order.customer_phone || "Телефон не указан";
    const deliveryTime = order.delivery_time || "Время не указано";

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Sarah Bernard Flower Shop <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: `Заказ #${order.id} был отменен`,
        html: `
          <h1>Уведомление об отмене заказа</h1>
          <p>Заказ #${order.id} был отменен пользователем.</p>
          <h2>Детали заказа:</h2>
          <ul>
            <li><strong>ID Заказа:</strong> ${order.id}</li>
            <li><strong>Имя клиента:</strong> ${order.customer_name}</li>
            <li><strong>Итоговая стоимость:</strong> ${order.total_price} KZT</li>
            <li><strong>Адрес доставки:</strong> ${fullAddress}</li>
            <li><strong>Время доставки:</strong> ${deliveryTime}</li>
            <li><strong>Телефон:</strong> ${phone}</li>
            <li><strong>Заказ создан:</strong> ${new Date(
              order.created_at
            ).toLocaleString("ru-RU")}</li>
          </ul>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Failed to send email:", errorData);
      return new Response(`Failed to send email: ${JSON.stringify(errorData)}`, {
        status: 500,
      });
    }

    return new Response("Email sent successfully", { status: 200 });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
});