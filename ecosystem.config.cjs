module.exports = {
  apps: [
    {
      name: "qatool-dashboard",
      cwd: "./dashboard",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      env: {
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/qatool_db",
        NEXTAUTH_URL: "http://localhost:3000",
        NEXTAUTH_SECRET: "qatool-super-secret-automation-key-2026",
      },
    },
  ],
};
