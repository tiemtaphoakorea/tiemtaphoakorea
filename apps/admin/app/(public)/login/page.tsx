"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PUBLIC_ROUTES } from "@repo/shared/routes";
import { type LoginFormValues, loginSchema } from "@repo/shared/schemas";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { AlertCircle, ArrowRight, Lock, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { adminClient } from "@/services/admin.client";

export default function AdminLoginPage() {
  "use no memo";
  const router = useRouter();
  const [error, setError] = useState("");

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
      const responseData = await adminClient.login(data);

      if (!responseData.success) {
        setError(responseData.error || "Đăng nhập thất bại");
        return;
      }

      if (responseData.access_token) {
        localStorage.setItem("sb-access-token", responseData.access_token);
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-50/50 p-4 duration-700 dark:bg-slate-950">
      <div className="bg-primary/10 absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full blur-[100px]" />
      <div className="absolute right-[-10%] bottom-[-10%] h-[40%] w-[40%] rounded-full bg-orange-500/10 blur-[100px]" />

      <Card className="shadow-primary/5 relative z-10 w-full max-w-md rounded-[2.5rem] border-none bg-white/80 shadow-2xl backdrop-blur-xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader className="space-y-4 px-10 py-6 pt-10">
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
          <CardContent className="space-y-6 px-10">
            {error && (
              <div className="bg-destructive/10 border-destructive/20 text-destructive animate-in fade-in slide-in-from-top-2 flex items-center gap-3 rounded-2xl border p-4 text-sm font-bold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="text-muted-foreground ml-1 text-xs font-black tracking-widest uppercase"
                >
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
                    className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 pl-12 text-base transition-all focus:bg-white"
                    aria-invalid={!!errors.username}
                  />
                </div>
                {errors.username && (
                  <p className="text-destructive ml-1 text-sm font-medium">
                    {errors.username.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <div className="ml-1 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-muted-foreground text-xs font-black tracking-widest uppercase"
                  >
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
                    type="password"
                    placeholder="••••••••"
                    className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 pl-12 text-base transition-all focus:bg-white"
                    aria-invalid={!!errors.password}
                  />
                </div>
                {errors.password && (
                  <p className="text-destructive ml-1 text-sm font-medium">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 px-10 pt-6 pb-10">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="shadow-primary/20 bg-primary hover:bg-primary/90 group h-14 w-full rounded-full text-lg font-black shadow-xl transition-all active:scale-[0.98]"
            >
              <span className="flex items-center justify-center gap-2">
                {isSubmitting ? "Đang xử lý..." : "Đăng nhập ngay"}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Button>
            <p className="text-muted-foreground text-center text-[10px] font-medium tracking-widest uppercase">
              &copy; 2026 K-SMART Pure Beauty. All rights reserved.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
