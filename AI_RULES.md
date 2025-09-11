# AI Rules for Sarah Bernard Flower Shop App

This document outlines the core technologies and best practices for developing the Sarah Bernard Flower Shop mobile application.

## Tech Stack Description

The application is built using the following technologies:

*   **React Native**: The foundational framework for building native mobile applications for iOS and Android from a single codebase.
*   **Expo**: A set of tools and services built around React Native, simplifying development, building, and deployment.
*   **React Navigation**: The standard solution for handling navigation within the app, including stack-based and tab-based navigation.
*   **JavaScript (ES6+)**: The primary programming language used for all application logic and UI components.
*   **React Context API**: Utilized for efficient global state management, such as managing the shopping cart and user authentication status.
*   **AsyncStorage**: Provides a simple, unencrypted, asynchronous, persistent, key-value storage system for local data.
*   **Ionicons**: A comprehensive and customizable icon library integrated via `@expo/vector-icons` for all UI iconography.
*   **React Native StyleSheet**: The built-in styling mechanism for React Native, used to create and manage component-specific styles.
*   **React Hooks**: Leverages modern React features like `useState`, `useEffect`, and `useContext` for managing component state and lifecycle.

## Library Usage Rules

To maintain consistency and efficiency, please adhere to the following guidelines when using libraries:

*   **UI Components**: Always use native React Native components (e.g., `View`, `Text`, `Image`, `TouchableOpacity`, `FlatList`, `ScrollView`, `TextInput`, `SafeAreaView`, `KeyboardAvoidingView`, `Alert`) for building the user interface.
*   **Navigation**: All navigation within the application must be implemented using `React Navigation`. Specifically, use `@react-navigation/native`, `@react-navigation/stack`, and `@react-navigation/bottom-tabs`.
*   **Icons**: For all icon needs, use `Ionicons` from the `@expo/vector-icons` package.
*   **Local Data Persistence**: Use `@react-native-async-storage/async-storage` for any data that needs to be stored locally on the device persistently.
*   **State Management**: Prefer React's built-in `useState` for local component state and `useContext` (with `CartContext` or similar) for global application state. Avoid introducing external state management libraries unless absolutely necessary and approved.
*   **Styling**: All component styling should be defined using `StyleSheet.create` from `react-native`. Do not introduce external CSS frameworks or styling libraries.
*   **External Interactions**: For opening external applications or URLs (e.g., WhatsApp links), use the `Linking` API from `react-native`.
*   **Language**: The codebase is currently written in JavaScript (ES6+). New code should also follow this convention.