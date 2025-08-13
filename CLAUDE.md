# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a template repository for cloud functions. The project structure and commands will depend on the cloud platform and runtime being used.

## Common Development Commands

Since this is a template directory, specific commands will depend on the implementation:

- For Node.js cloud functions: `npm install`, `npm test`, `npm run build`, `npm run deploy`
- For Python cloud functions: `pip install -r requirements.txt`, `pytest`, `python -m build`
- For Go cloud functions: `go mod tidy`, `go test ./...`, `go build`

## Architecture Notes

This template is intended for serverless cloud function development. When implementing:

- Each function should be self-contained and stateless
- Environment variables should be used for configuration
- Functions should handle errors gracefully and return appropriate HTTP status codes
- Logging should be structured for cloud monitoring
- Dependencies should be minimal to reduce cold start times

## Platform-Specific Considerations

- **AWS Lambda**: Use `serverless.yml` or SAM templates for deployment
- **Google Cloud Functions**: Use `gcloud functions deploy` or Cloud Build
- **Azure Functions**: Use Azure Functions Core Tools or ARM templates
- **Vercel/Netlify**: Use platform-specific configuration files

## Testing

- Unit tests should mock external dependencies
- Integration tests should use test environments
- Load testing for performance validation before production deployment