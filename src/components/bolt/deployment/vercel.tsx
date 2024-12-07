import { Octokit } from '@octokit/rest';
import path from 'path';
import type { WebContainer } from '@webcontainer/api';
import { Vercel } from '@vercel/sdk'
import { createScopedLogger } from '@/components/bolt/utils/logger';

const logger = createScopedLogger('VercelDeployer');

const vercel = new Vercel({
  bearerToken: process.env.NEXT_PUBLIC_VERCEL_TOKEN,
  serverURL: 'https://api.vercel.com'
});

export class VercelDeployer {
  private githubClient: Octokit;

  constructor(githubToken?: string) {
    if (!githubToken) {
      logger.error('GitHub token is required for deployment');
      throw new Error('GitHub token is required for deployment');
    }
    logger.debug('Initializing VercelDeployer with GitHub token');
    this.githubClient = new Octokit({ 
      auth: githubToken,
      baseUrl: 'https://api.github.com',
      headers: {
        accept: 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28' // Latest GitHub API version
      },
      userAgent: 'MathTutor/1.0.0' // Optional but can help with API calls
    });
  }

  private async extractProjectFiles(webcontainer: WebContainer) {
    logger.debug('Extracting project files from WebContainer');
    const fs = webcontainer.fs;
    const projectFiles: Record<string, string> = {};
  
    async function traverseDirectory(dir = '/') {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      logger.trace(`Traversing directory: ${dir}, found ${entries.length} entries`);
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await traverseDirectory(fullPath);
        } else {
          const content = await fs.readFile(fullPath, 'utf-8');
          // Normalize path to remove leading /
          const normalizedPath = fullPath.replace(/^\//, '');
          projectFiles[normalizedPath] = content;
          logger.trace(`Added file: ${normalizedPath}`);
        }
      }
    }
  
    await traverseDirectory();
    logger.debug(`Extracted ${Object.keys(projectFiles).length} files from WebContainer`);
    return projectFiles;
  }

  private async createGitHubRepository(projectFiles: Record<string, string>) {
    try {
      const repoName = `generated-project-${Date.now()}`;
      logger.info(`Creating GitHub repository: ${repoName}`);

      // Create a new repository
      const repo = await this.githubClient.repos.createForAuthenticatedUser({
        name: repoName,
        private: false,
        auto_init: true // Initialize with README to have a base commit
      });
      logger.debug(`Repository created: ${repo.data.html_url}`);

      // Create files using REST API method
      for (const [filePath, content] of Object.entries(projectFiles)) {
        await this.githubClient.repos.createOrUpdateFileContents({
          owner: repo.data.owner.login,
          repo: repoName,
          path: filePath,
          message: `Add ${filePath}`,
          content: Buffer.from(content).toString('base64'),
          branch: 'main'
        });
      }

      return {
        repoUrl: repo.data.clone_url,
        owner: repo.data.owner.login,
        repoName
      };
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Detailed GitHub API Error:', {
          message: error.message,
          status: (error as any).status,
          response: (error as any).response?.data,
          headers: (error as any).headers
        });
      } else {
        logger.error('An unknown error occurred');
      }
      throw error;
    }
  }

  private async deployToVercel(githubRepoInfo: { 
    repoUrl: string, 
    owner: string, 
    repoName: string 
  }) {
    try {
      logger.info(`Deploying repository to Vercel: ${githubRepoInfo.repoUrl}`);
      // Deploy to Vercel using Git source
      const vercelDeployment = await vercel.deployments.createDeployment({
        requestBody: {
          gitMetadata: {
            remoteUrl: githubRepoInfo.repoUrl,
            commitRef: "main",
            dirty: true,
          },
          name: `generated-project-${Date.now()}`,
          projectSettings: {
            framework: "nextjs",
            buildCommand: "npm run build",
            outputDirectory: ".next"
          }
        }
      });

      logger.info(`Deployment successful. URL: ${vercelDeployment.url}`);
      return {
        deploymentUrl: vercelDeployment.url,
        previewUrl: vercelDeployment.alias // Vercel API returns alias instead of preview_url
      };
    } catch (error) {
      logger.error('Vercel deployment error:', error);
      throw error;
    }
  }

  async deployWebContainerProject(webcontainer: WebContainer) {
    try {
      logger.info('Starting WebContainer project deployment');
      // Step 1: Extract files from WebContainer
      const projectFiles = await this.extractProjectFiles(webcontainer);

      // Step 2: Create GitHub Repository
      const githubRepoInfo = await this.createGitHubRepository(projectFiles);

      // Step 3: Deploy to Vercel
      const deployment = await this.deployToVercel(githubRepoInfo);

      logger.info('Deployment completed successfully');
      return {
        success: true,
        shareableLink: deployment.previewUrl,
        deploymentDetails: deployment
      };
    } catch (error) {
      logger.error('Deployment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}