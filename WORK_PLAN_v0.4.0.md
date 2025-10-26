# Work Plan: v0.4.0 - Authentication Support

**Issue**: #7
**Version**: 0.4.0
**Feature**: Authentication support for internal systems
**Estimated Complexity**: Medium-High
**Dependencies**: v0.3.0 (Document Generation)

## Overview

Implement comprehensive authentication support to enable Quill to crawl internal systems that require login. This includes session-based authentication, credential management, and CLI integration.

## Implementation Checklist

### Phase 1: Type Definitions & Configuration

- [ ] **Extend AuthConfig interface** (`src/types/index.ts`)
  ```typescript
  export interface AuthConfig {
    type: 'session' | 'basic' | 'oauth';
    loginUrl?: string;
    username?: string;
    password?: string;
    sessionPath?: string;
    interactive?: boolean;
    timeout?: number;
  }
  ```

- [ ] **Add SessionState interface** (`src/types/index.ts`)
  ```typescript
  export interface SessionState {
    cookies: Array<{
      name: string;
      value: string;
      domain: string;
      path: string;
      expires: number;
      httpOnly: boolean;
      secure: boolean;
    }>;
    origins: Array<{
      origin: string;
      localStorage: Array<{ name: string; value: string }>;
    }>;
  }
  ```

- [ ] **Update QuillConfig** (`src/types/index.ts`)
  - Add auth configuration to main config
  - Add authentication-related options

### Phase 2: Session Management

- [ ] **Create SessionManager** (`src/auth/session-manager.ts`)
  - Load session state from file
  - Save session state to file
  - Validate session state
  - Check if session is valid/expired

  ```typescript
  export class SessionManager {
    async load(sessionPath: string): Promise<SessionState | null>
    async save(sessionPath: string, state: SessionState): Promise<void>
    async isValid(state: SessionState): Promise<boolean>
    async clear(sessionPath: string): Promise<void>
  }
  ```

- [ ] **Implement session persistence**
  - Use Playwright's `context.storageState()`
  - JSON file format for session storage
  - Automatic session expiry detection

### Phase 3: Login Automation

- [ ] **Create LoginAgent** (`src/agent/subagents/login-agent.ts`)
  - Navigate to login URL
  - Detect username/password fields
  - Fill credentials
  - Click submit button
  - Verify login success
  - Handle login errors

  ```typescript
  export class LoginAgent {
    constructor(playwright: PlaywrightMCP, options: LoginOptions)
    async login(credentials: Credentials): Promise<AgentResult<SessionState>>
    private async detectLoginForm(): Promise<FormElements>
    private async fillCredentials(form: FormElements, creds: Credentials): Promise<void>
    private async submitForm(form: FormElements): Promise<void>
    private async verifyLoginSuccess(): Promise<boolean>
  }
  ```

- [ ] **Implement form detection**
  - Find username input (name, id, placeholder patterns)
  - Find password input (type="password")
  - Find submit button (type="submit", role="button")

- [ ] **Implement login verification**
  - Check for redirect after login
  - Detect error messages
  - Verify successful authentication indicators

### Phase 4: Credential Management

- [ ] **Create CredentialProvider** (`src/auth/credential-provider.ts`)
  - Load from environment variables
  - Load from configuration file
  - Interactive prompt (if needed)
  - Secure credential handling

  ```typescript
  export class CredentialProvider {
    async getCredentials(config: AuthConfig): Promise<Credentials>
    private loadFromEnv(): Credentials | null
    private loadFromConfig(config: AuthConfig): Credentials | null
    private async promptUser(): Promise<Credentials>
  }
  ```

- [ ] **Environment variable support**
  - `QUILL_USERNAME`
  - `QUILL_PASSWORD`
  - `QUILL_SESSION_PATH`

### Phase 5: CLI Integration

- [ ] **Update generate command** (`src/cli/commands/generate.ts`)
  - Add authentication options
  - Handle credential provider
  - Manage session state

  ```typescript
  interface GenerateOptions {
    // ... existing options
    authType?: 'session' | 'basic' | 'oauth';
    loginUrl?: string;
    sessionPath?: string;
    authInteractive?: boolean;
  }
  ```

- [ ] **Add CLI flags**
  ```bash
  --auth-type <type>         Authentication type (session, basic, oauth)
  --login-url <url>          Login page URL
  --session-path <path>      Path to save/load session state
  --auth-interactive         Interactive authentication mode
  ```

### Phase 6: MainAgent Integration

- [ ] **Update MainAgent** (`src/agent/main-agent.ts`)
  - Add SessionManager instance
  - Add LoginAgent instance
  - Pre-flight authentication check
  - Use authenticated session for crawling

  ```typescript
  private sessionManager?: SessionManager;
  private loginAgent?: LoginAgent;

  async execute(): Promise<AgentResult<PageInfo[]>> {
    // 1. Check if authentication is required
    // 2. Load existing session or perform login
    // 3. Apply session state to Playwright context
    // 4. Continue with normal crawling
  }
  ```

- [ ] **Authentication workflow**
  1. Check if auth config is provided
  2. Try to load existing session
  3. If session invalid, perform login
  4. Save new session state
  5. Use authenticated context for crawling

### Phase 7: Error Handling & Validation

- [ ] **Authentication error handling**
  - Invalid credentials error
  - Session expired error
  - Login timeout error
  - Network error during login

- [ ] **Validation**
  - Validate session state format
  - Check credential completeness
  - Verify login URL accessibility

### Phase 8: Testing & Documentation

- [ ] **Manual testing**
  - Test with mock login page
  - Test session persistence
  - Test credential loading
  - Test error scenarios

- [ ] **Update documentation**
  - Add authentication examples to README
  - Document environment variables
  - Add troubleshooting guide

## File Structure

```
src/
├── auth/
│   ├── session-manager.ts       (NEW)
│   ├── credential-provider.ts   (NEW)
│   └── types.ts                 (NEW)
├── agent/
│   ├── main-agent.ts            (MODIFIED)
│   └── subagents/
│       └── login-agent.ts       (NEW)
├── types/
│   └── index.ts                 (MODIFIED)
└── cli/
    └── commands/
        └── generate.ts          (MODIFIED)
```

## Expected Usage Examples

### Example 1: Environment Variables

```bash
export QUILL_USERNAME="admin"
export QUILL_PASSWORD="secure-password"

quill generate \
  --url http://internal-monitoring.company.com \
  --auth-type session \
  --login-url /auth/login \
  --session-path ./session.json
```

### Example 2: Configuration File

```yaml
# quill.config.yaml
target:
  url: http://monitoring.company.com
  depth: 2

auth:
  type: session
  login_url: /auth/login
  session_path: ./session.json

output:
  format: markdown
  path: ./output
```

```bash
quill generate --config quill.config.yaml
```

### Example 3: Interactive Authentication

```bash
quill generate \
  --url http://internal.company.com \
  --auth-type session \
  --auth-interactive

# Prompts:
# Username: admin
# Password: ******
```

## Technical Implementation Details

### Session State Structure

Playwright's session state includes:
- Cookies with expiration
- LocalStorage data
- SessionStorage data
- Origins and permissions

### Form Detection Patterns

**Username field detection**:
- `input[name*="user" i]`
- `input[name*="login" i]`
- `input[name*="email" i]`
- `input[id*="user" i]`
- `input[placeholder*="username" i]`

**Password field detection**:
- `input[type="password"]`

**Submit button detection**:
- `button[type="submit"]`
- `input[type="submit"]`
- `button:has-text("Login")`
- `button:has-text("Sign in")`

### Login Success Verification

1. Check for URL change (redirect)
2. Check for error message absence
3. Check for specific success indicators
4. Verify cookies are set

## Success Criteria

- ✅ Successfully authenticate to login-protected systems
- ✅ Session state persists across multiple runs
- ✅ Credentials can be loaded from environment variables
- ✅ Authentication errors are properly handled and reported
- ✅ CLI provides clear feedback during authentication
- ✅ Documentation includes comprehensive authentication examples
- ✅ Build passes with 0 TypeScript errors
- ✅ All authentication workflows tested manually

## Dependencies

- Playwright's `context.storageState()` API
- Node.js `fs/promises` for file operations
- Commander.js for CLI argument parsing
- dotenv for environment variable loading (if needed)

## Risks & Mitigation

**Risk**: Different login forms have varying structures
- **Mitigation**: Implement flexible form detection with multiple selectors

**Risk**: Session expiry during long crawls
- **Mitigation**: Implement session refresh mechanism

**Risk**: Credentials stored insecurely
- **Mitigation**: Use file permissions, recommend environment variables

**Risk**: Login automation detected as bot
- **Mitigation**: Use realistic delays, human-like interactions

## Version Bump

- Package version: `0.3.0` → `0.4.0`
- Major feature addition (authentication)
- Breaking changes: None (backward compatible)

## Estimated Timeline

- Phase 1-2: Type definitions & Session Manager (1 day)
- Phase 3-4: Login automation & Credentials (2 days)
- Phase 5-6: CLI & MainAgent integration (1 day)
- Phase 7-8: Error handling & Testing (1 day)

**Total**: ~5 days (medium-high complexity)
