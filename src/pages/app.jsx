import Head from 'next/head';
import WorkflowAutopilot from '@/components/WorkflowAutopilot';

export default function App() {
  return (
    <>
      <Head>
        <title>Autopilot - Dashboard</title>
      </Head>
      <main>
        <WorkflowAutopilot />
      </main>
    </>
  );
}