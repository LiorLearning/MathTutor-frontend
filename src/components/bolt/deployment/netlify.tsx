import { Octokit } from '@octokit/rest';
import netlify from 'netlify';
import path from 'path';

class NetlifyDeployer {
  private githubClient: Octokit;
  private netlifyClient: any;

  constructor(githubToken: string, netlifyToken: string) {
    this.githubClient = new Octokit({ auth: githubToken });
    this.netlifyClient = netlify(netlifyToken);
  }

  async extractProjectFiles(webcontainer: any) {
    const fs = webcontainer.fs;
    const projectFiles = {};

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

  async createGitHubRepository(projectFiles: Record<string, string>) {
    // Generate a unique repository name
    const repoName = `generated-project-${Date.now()}`;

    // Create a new repository
    const repo = await this.githubClient.repos.create({
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

  async deployToNetlify(githubRepoInfo: { 
    repoUrl: string, 
    owner: string, 
    repoName: string 
  }) {
    try {
      // Create a new site on Netlify and connect to GitHub
      const site = await this.netlifyClient.sites.create({
        name: `generated-project-${Date.now()}`,
        repo: {
          provider: 'github',
          repo: `${githubRepoInfo.owner}/${githubRepoInfo.repoName}`
        },
        build_settings: {
          cmd: 'npm run build',
          dir: 'build' // or 'dist' depending on your project
        }
      });

      return {
        siteUrl: site.ssl_url || site.url,
        deployUrl: site.deploy_url
      };
    } catch (error) {
      console.error('Netlify deployment error:', error);
      throw error;
    }
  }

  async deployWebContainerProject(webcontainer: any) {
    try {
      // Step 1: Extract files from WebContainer
      const projectFiles = await this.extractProjectFiles(webcontainer);

      // Step 2: Create GitHub Repository
      const githubRepoInfo = await this.createGitHubRepository(projectFiles);

      // Step 3: Deploy to Netlify
      const deployment = await this.deployToNetlify(githubRepoInfo);

      return {
        success: true,
        shareableLink: deployment.siteUrl,
        deploymentDetails: deployment
      };
    } catch (error) {
      console.error('Deployment failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Usage example
async function deployProject(webcontainer: any) {
  const deployer = new NetlifyDeployer(
    process.env.GITHUB_TOKEN, 
    process.env.NETLIFY_TOKEN
  );

  const result = await deployer.deployWebContainerProject(webcontainer);
  return result;
}