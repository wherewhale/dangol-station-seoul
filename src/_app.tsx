import { AppsInToss } from '@apps-in-toss/framework';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';
import { InitialProps } from '@granite-js/react-native';
import { context } from '../require.context';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 공공 API 호출 한도 보호: 실패 시 1회만 재시도
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContainer({ children }: PropsWithChildren<InitialProps>) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export default AppsInToss.registerApp(AppContainer, { context });
