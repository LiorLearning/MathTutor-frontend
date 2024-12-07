import { Octokit } from '@octokit/rest';
import path from 'path';
import type { WebContainer } from '@webcontainer/api';

export class VercelDeployer {
  private githubClient: Octokit;

  constructor(githubToken: string) {
    this.githubClient = new Octokit({ auth: githubToken });
  }

  private async extractProjectFiles(webcontainer: WebContainer) {
    const fs = webcontainer.fs;
    const projectFiles: Record<string, string> = {};
  
    async function traverseDirectory(dir = '/') {
      const entries = await fs.readdir(dir);
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stats = await fs.stat(fullPath);
        
        if (stats.isDirectory()) {
          await traverseDirectory(fullPath);
        } else {
          const content = await fs.readFile(fullPath, 'utf-8');
          // Normalize path to remove leading /
          const normalizedPath = fullPath.replace(/^\//, '');
          projectFiles[normalizedPath] = content;
        }
      }
    }
  
    await traverseDirectory();
    return projectFiles;
  }

  private async createGitHubRepository(projectFiles: Record<string, string>) {
    // Generate a unique repository name
    const repoName = `generated-project-${Date.now()}`;

    // Create a new repository
    const repo = await this.githubClient.repos.createForAuthenticatedUser({
      name: repoName,
      private: false,
      auto_init: true // Create with a README to initialize
    });

    // Create files in the repository
    for (const [path, content] of Object.entries(projectFiles)) {
      await this.githubClient.repos.createOrUpdateFileContents({
        owner: repo.data.owner.login,
        repo: repoName,
        path,
        message: `Add ${path}`,
        content: Buffer.from(content).toString('base64'),
        branch: 'main'
      });
    }

    return {
      repoUrl: repo.data.clone_url,
      owner: repo.data.owner.login,
      repoName
    };
  }

  private async deployToVercel(githubRepoInfo: { 
    repoUrl: string, 
    owner: string, 
    repoName: string 
  }) {
    try {
      // Deploy to Vercel using GitHub repository URL
      const vercelDeployment = await vercel.deployments.create({
        repository: githubRepoInfo.repoUrl,
        team: null, // Optional: specify Vercel team
        project: {
          name: `generated-project-${Date.now()}`,
          framework: 'nextjs' // Or appropriate framework
        }
      });

      return {
        deploymentUrl: vercelDeployment.url,
        previewUrl: vercelDeployment.preview_url
      };
    } catch (error) {
      console.error('Vercel deployment error:', error);
      throw error;
    }
  }

  async deployWebContainerProject(webcontainer: WebContainer) {
    try {
      // Step 1: Extract files from WebContainer
      const projectFiles = await this.extractProjectFiles(webcontainer);

      // Step 2: Create GitHub Repository
      const githubRepoInfo = await this.createGitHubRepository(projectFiles);

      // Step 3: Deploy to Vercel
      const deployment = await this.deployToVercel(githubRepoInfo);

      return {
        success: true,
        shareableLink: deployment.previewUrl,
        deploymentDetails: deployment
      };
    } catch (error) {
      console.error('Deployment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}