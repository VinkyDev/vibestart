import { View } from "react-native";

import { AuthForm } from "#src/components/auth-form.tsx";

const Login = () => (
  <View className="bg-background flex-1 px-5 pt-8">
    <AuthForm />
  </View>
);

export default Login;
