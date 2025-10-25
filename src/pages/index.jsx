import Head from 'next/head';
import WorkflowAutopilot from '@/components/WorkflowAutopilot';

export default function Home() {
  return (
    <>
      <Head>
        <title>Workflow Autopilot - AI-Powered Automation</title>
        <meta name="description" content="AI-powered workflow automation platform with Claude and MCP" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <WorkflowAutopilot />
      </main>
    </>
  );
}
