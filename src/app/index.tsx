import { Redirect } from 'expo-router';

export default function Index() {
  // Temporary bypass for development so Fast Refresh/Errors don't force re-login
  return <Redirect href="/tabs" />;
}
