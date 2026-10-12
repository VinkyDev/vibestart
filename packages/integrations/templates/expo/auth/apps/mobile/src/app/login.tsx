import { View } from "react-native";

import { AuthForm } from "#src/components/auth-form.tsx";

const Login = () => (
  <View className="bg-background flex-1 p-4">
    <AuthForm />
  </View>
);

export default Login;
