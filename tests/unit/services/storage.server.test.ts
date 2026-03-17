import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteImage, uploadImage } from "@/services/storage.server";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

describe("Storage Service", () => {
  const mockSupabase = {
    storage: {
      from: vi.fn().mockReturnThis(),
      upload: vi.fn(),
      getPublicUrl: vi.fn(),
      remove: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (createAdminClient as any).mockReturnValue(mockSupabase);
  });

  describe("uploadImage", () => {
    it("should upload file and return publicUrl", async () => {
      const mockFile = new File(["test"], "test.png", { type: "image/png" });
      mockSupabase.storage.upload.mockResolvedValue({ data: {}, error: null });
      mockSupabase.storage.getPublicUrl.mockReturnValue({
        data: { publicUrl: "http://example.com/test.png" },
      });

      const url = await uploadImage(mockFile);

      expect(mockSupabase.storage.from).toHaveBeenCalledWith("product-images");
      expect(mockSupabase.storage.upload).toHaveBeenCalled();
      expect(url).toBe("http://example.com/test.png");
    });

    it("should throw error if upload fails", async () => {
      const mockFile = new File(["test"], "test.png", { type: "image/png" });
      mockSupabase.storage.upload.mockResolvedValue({
        data: null,
        error: new Error("Upload failed"),
      });

      await expect(uploadImage(mockFile)).rejects.toThrow("Upload failed");
    });
  });

  describe("deleteImage", () => {
    it("should call remove with correct path", async () => {
      const publicUrl =
        "http://example.com/storage/v1/object/public/product-images/products/test.png";
      mockSupabase.storage.remove.mockResolvedValue({ data: {}, error: null });

      await deleteImage(publicUrl);

      expect(mockSupabase.storage.from).toHaveBeenCalledWith("product-images");
      expect(mockSupabase.storage.remove).toHaveBeenCalledWith(["products/test.png"]);
    });

    it("should throw error if remove fails", async () => {
      const publicUrl =
        "http://example.com/storage/v1/object/public/product-images/products/test.png";
      const error = new Error("Delete failed");
      mockSupabase.storage.remove.mockResolvedValue({ data: null, error });

      await expect(deleteImage(publicUrl)).rejects.toThrow("Delete failed");
    });
  });
});
