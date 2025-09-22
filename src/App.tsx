import { Toaster } from "@/components/ui";
import "@/config/dayjs";
import { AppStorageProvider, ThemeProvider } from "@/contexts";
import { Routes } from "@/router";
import "@/styles/base.css";
import { memo } from "react";
import { Router } from "wouter";

export const App: React.FC = memo(() => {
  return (
    <ThemeProvider>
      <AppStorageProvider>
        <Router>
          <Routes />
        </Router>
        <Toaster />
      </AppStorageProvider>
    </ThemeProvider>
  );
});
