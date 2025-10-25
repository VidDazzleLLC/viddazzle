# Workflow Autopilot

AI-powered workflow automation platform built with Claude Opus 4.1, MCP (Model Context Protocol), Next.js, and Supabase.

## Features

- **AI-Powered Workflow Generation**: Describe what you want to automate in natural language, and Claude generates a complete workflow
- **Visual Workflow Editor**: See and modify workflows with an intuitive interface
- **MCP Tool Integration**: 15+ pre-configured tools for file operations, HTTP requests, database queries, and more
- **Connector Library**: Easy integration with Slack, Gmail, GitHub, Notion, and 10+ other services
- **Learning System**: AI learns from execution patterns and provides improvement suggestions
- **Vector Search**: Find similar workflows using semantic search with vector embeddings
- **Execution Engine**: Robust execution with retries, error handling, and timeouts
- **Supabase Backend**: PostgreSQL with pgvector for embeddings and real-time capabilities

## Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS, Lucide Icons
- **Backend**: Next.js API Routes (serverless functions)
- **AI**: Claude Opus 4.1 (Anthropic API)
- **Database**: Supabase (PostgreSQL + pgvector)
- **Deployment**: Vercel
- **Tools**: MCP (Model Context Protocol)

## Quick Start

### Prerequisites

- Node.js 18.17.0 or higher
- npm or yarn
- Anthropic API key (for Claude)
- Supabase account (free tier works)
- (Optional) OpenAI API key for embeddings

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd viddazzle
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your credentials:
   ```env
   # Claude API
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
   CLAUDE_MODEL=claude-opus-4-20250514

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Optional: OpenAI for embeddings
   OPENAI_API_KEY=sk-xxxxx
   ```

4. **Set up Supabase database**

   Run the SQL schema in your Supabase SQL editor:
   ```bash
   cat supabase/schema.sql
   ```

   Copy and paste the contents into Supabase SQL Editor and run it.

5. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
viddazzle/
├── docs/
│   └── CONFIGURATION_TEMPLATES.md    # All config templates
├── public/
│   └── config/
│       ├── MCP_TOOLS_DEFINITION.json # Tool definitions
│       └── CONNECTORS_LIBRARY.json   # Connector configs
├── src/
│   ├── components/
│   │   └── WorkflowAutopilot.jsx     # Main dashboard
│   ├── lib/
│   │   └── supabase.js               # Database client
│   ├── pages/
│   │   ├── api/
│   │   │   ├── generate-workflow.js  # Claude workflow generator
│   │   │   ├── execute-workflow.js   # Workflow executor
│   │   │   ├── learn-tutorial.js     # Learning system
│   │   │   └── workflows.js          # CRUD operations
│   │   ├── _app.jsx                  # Next.js app wrapper
│   │   └── index.jsx                 # Home page
│   └── styles/
│       └── globals.css               # Global styles
├── supabase/
│   └── schema.sql                    # Database schema
├── .env.example                      # Environment template
├── next.config.js                    # Next.js config
├── package.json                      # Dependencies
├── tailwind.config.js                # Tailwind config
└── vercel.json                       # Vercel deployment config
```

## Usage

### 1. Generate a Workflow

On the **Generate** tab:
1. Describe what you want to automate (e.g., "Send a daily email report with database statistics")
2. Click "Generate Workflow"
3. Claude will create a complete workflow with all necessary steps

### 2. View and Edit Workflow

On the **Workflow** tab:
- See all the steps in your workflow
- Each step shows the tool being used and its configuration
- Click "Execute" to run the workflow

### 3. Execute Workflow

On the **Execution** tab:
- View real-time execution logs
- See outputs from each step
- Monitor success/failure status
- Review execution duration

### 4. Workflow Library

On the **Library** tab:
- Browse all saved workflows
- View execution statistics
- Quickly run or edit existing workflows

## Available MCP Tools

| Category | Tools |
|----------|-------|
| **File System** | file_read, file_write |
| **Network** | http_request, web_scrape |
| **Database** | database_query, vector_search |
| **Execution** | execute_code (Python, JS, Bash) |
| **Communication** | email_send, slack_message |
| **Productivity** | calendar_event |
| **Data** | transform_data |
| **Control Flow** | conditional_branch, loop_iteration, wait_delay |

## Connector Library

Pre-configured integrations:
- **Communication**: Slack, Gmail, SendGrid, Twilio
- **Productivity**: Google Calendar, Notion, Airtable
- **Developer**: GitHub
- **Payment**: Stripe
- **Storage**: AWS S3
- **Database**: PostgreSQL, Supabase
- **AI**: OpenAI
- **Automation**: Zapier, HTTP API

## API Endpoints

### POST /api/generate-workflow
Generate a workflow using Claude

**Request:**
```json
{
  "prompt": "Send a Slack message when database has new records",
  "context": {},
  "save": true
}
```

**Response:**
```json
{
  "success": true,
  "workflow": { ... },
  "saved": { "id": "uuid", ... }
}
```

### POST /api/execute-workflow
Execute a workflow

**Request:**
```json
{
  "workflowId": "uuid",
  "input": {}
}
```

**Response:**
```json
{
  "success": true,
  "executionId": "uuid",
  "outputs": { ... },
  "log": [ ... ],
  "duration": 1234
}
```

### POST /api/learn-tutorial
Store a tutorial with embeddings

**Request:**
```json
{
  "content": "Tutorial content",
  "metadata": {},
  "category": "automation",
  "tags": ["email", "notification"]
}
```

### GET /api/learn-tutorial
Search tutorials

**Query params:**
- `query`: Search query
- `matchCount`: Number of results (default: 5)
- `matchThreshold`: Similarity threshold (default: 0.7)

## Deployment to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set environment variables in Vercel dashboard**
   - Add all variables from `.env.example`
   - Set production values

4. **Configure Supabase**
   - Run the schema in your production Supabase instance
   - Update environment variables with production URLs

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Claude API key | Yes |
| `CLAUDE_MODEL` | Claude model name | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `OPENAI_API_KEY` | OpenAI API key (for embeddings) | Optional |
| `EMBEDDING_MODEL` | Embedding model name | Optional |
| `MCP_TOOLS_ENABLED` | Enable MCP tools | Optional |
| `MAX_WORKFLOW_STEPS` | Max steps per workflow | Optional |

## Database Schema

The app uses PostgreSQL with pgvector for embeddings:

- **workflows**: Store workflow definitions
- **workflow_executions**: Track execution history
- **tutorial_embeddings**: Store tutorials with vector embeddings
- **mcp_tool_usage**: Log tool usage for analytics
- **connectors**: Store connector configurations

See `supabase/schema.sql` for complete schema.

## Development

### Run locally
```bash
npm run dev
```

### Build for production
```bash
npm run build
npm start
```

### Lint
```bash
npm run lint
```

## Extending the Platform

### Add a New MCP Tool

1. Edit `public/config/MCP_TOOLS_DEFINITION.json`
2. Add your tool definition with input/output schemas
3. Implement the tool in `src/pages/api/execute-workflow.js`

### Add a New Connector

1. Edit `public/config/CONNECTORS_LIBRARY.json`
2. Add connector with authentication config
3. Map connector actions to MCP tools

### Add Custom Workflow Steps

Workflows support custom steps with these features:
- Variable substitution: `{{step_id.output_field}}`
- Error handling: `on_error: "stop|continue|retry"`
- Retries: `retry: { max_attempts: 3, delay_ms: 1000 }`
- Timeouts: `timeout: 30000`

## Troubleshooting

### Claude API errors
- Verify `ANTHROPIC_API_KEY` is correct
- Check API rate limits
- Ensure model name is valid

### Supabase connection errors
- Verify Supabase URL and keys
- Check database schema is applied
- Ensure pgvector extension is enabled

### Execution timeouts
- Increase `WORKFLOW_TIMEOUT` in environment
- Optimize workflow steps
- Check network connectivity

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Documentation: See `docs/` folder

## Credits

Built with:
- [Claude](https://www.anthropic.com/claude) by Anthropic
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [TailwindCSS](https://tailwindcss.com/)
- [Vercel](https://vercel.com/)

---

Made with by VidDazzle LLC
