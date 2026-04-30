"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ApiError } from "@workspace/shared/api-client";
import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import { type LoginFormValues, loginSchema } from "@workspace/shared/schemas";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { adminClient } from "@/services/admin.client";

export default function AdminLoginPage() {
  "use no memo";
  const router = useRouter();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  async function onSubmit(data: LoginFormValues) {
    setError("");
    try {
      await adminClient.login(data);
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.data?.error ?? "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập.",
        );
      } else {
        setError("Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.");
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md rounded-2xl border border-border bg-card shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader className="space-y-4 px-8 py-6 pt-8">
            <div className="flex justify-center">
              <Link href={PUBLIC_ROUTES.HOME} className="group flex shrink-0 items-center gap-2">
                <div className="bg-primary flex h-12 w-12 rotate-6 items-center justify-center rounded-2xl transition-transform group-hover:rotate-0">
                  <span className="text-2xl leading-none font-black text-white">K</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-primary text-2xl leading-none font-black tracking-tight">
                    K-SMART
                  </span>
                  <span className="text-muted-foreground text-[10px] font-bold tracking-[0.2em] uppercase">
                    Admin Panel
                  </span>
                </div>
              </Link>
            </div>
            <div className="space-y-1 text-center">
              <CardTitle className="text-primary text-2xl font-black">Đăng nhập Quản trị</CardTitle>
              <CardDescription className="font-medium">
                Vui lòng nhập tài khoản để vào hệ thống quản lý.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8">
            {error && (
              <div className="bg-destructive/10 border-destructive/20 text-destructive animate-in fade-in slide-in-from-top-2 flex items-center gap-3 rounded-2xl border p-4 text-sm font-bold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-3">
                <label htmlFor="username" className="block text-sm font-medium text-foreground">
                  Tên đăng nhập
                </label>
                <div className="group relative">
                  <div className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-4 -translate-y-1/2 transition-colors">
                    <User className="h-4 w-4" />
                  </div>
                  <Input
                    id="username"
                    {...register("username")}
                    type="text"
                    placeholder="admin"
                    className="h-12 rounded-lg border-border bg-background pl-12 transition-all focus:ring-1 focus:ring-ring"
                    aria-invalid={!!errors.username}
                  />
                </div>
                {errors.username && (
                  <p className="text-destructive ml-1 text-sm font-medium">
                    {errors.username.message}
                  </p>
                )}
              </div>
              <div className="space-y-3">
                <div className="ml-1 flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-foreground">
                    Mật khẩu
                  </label>
                </div>
                <div className="group relative">
                  <div className="text-muted-foreground group-focus-within:text-primary absolute top-1/2 left-4 -translate-y-1/2 transition-colors">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="password"
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="h-12 rounded-lg border-border bg-background pl-12 pr-12 transition-all focus:ring-1 focus:ring-ring"
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-4 -translate-y-1/2 transition-colors"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-destructive ml-1 text-sm font-medium">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 px-8 pt-6 pb-8">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-70"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Đang xử lý...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Đăng nhập
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              &copy; 2026 K-SMART Pure Beauty. All rights reserved.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
