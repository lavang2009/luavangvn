'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

type Product = {
  id: string;
  name: string;
  category?: string;
};

type FileAsset = {
  fileName?: string;
  storagePath?: string;
  [key: string]: unknown;
};

export default function AdminFiles() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [asset, setAsset] = useState<FileAsset | null>(null);

  async function token(): Promise<string | undefined> {
    const { firebaseAuth } = await import('@/lib/firebase/client');
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) return undefined;
    return currentUser.getIdToken();
  }

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const t = await token();
        if (!t) return;

        const response = await fetch('/api/admin/products', {
          headers: { Authorization: `Bearer ${t}` },
        });
        if (!response.ok) return;

        const json = await response.json();
        const items = Array.isArray(json?.data?.items) ? json.data.items : [];
        const fileProducts = items.filter((product: Product) => product.category === 'file');

        if (!cancelled && json?.ok) {
          setProducts(fileProducts);
        }
      } catch {
        // Keep the page usable when the admin API is temporarily unavailable.
      }
    }

    void loadProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  async function upload() {
    if (!file || !productId) return;

    setLoading(true);
    try {
      const t = await token();
      if (!t) {
        toast.error('Phiên đăng nhập quản trị đã hết hạn.');
        return;
      }

      const form = new FormData();
      form.append('file', file);
      form.append('productId', productId);

      const response = await fetch('/api/admin/files', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}` },
        body: form,
      });
      const json = await response.json();

      if (!json?.ok) {
        toast.error(json?.error?.message ?? 'Upload file thất bại.');
        return;
      }

      setAsset(json.data as FileAsset);
      toast.success('Upload private storage thành công.');
    } catch {
      toast.error('Không thể upload file lúc này.');
    } finally {
      setLoading(false);
    }
  }

  async function attach() {
    if (!asset) return;

    try {
      const t = await token();
      if (!t) {
        toast.error('Phiên đăng nhập quản trị đã hết hạn.');
        return;
      }

      const response = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${t}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: productId,
          data: { fileAsset: asset },
        }),
      });
      const json = await response.json();

      if (json?.ok) {
        toast.success('Đã gán file vào product.');
      } else {
        toast.error(json?.error?.message ?? 'Không thể gán file.');
      }
    } catch {
      toast.error('Không thể gán file lúc này.');
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-black">Files</h1>
      <div className="lv-glass mt-6 max-w-2xl rounded-2xl p-5">
        <select
          value={productId}
          onChange={(event) => setProductId(event.target.value)}
          className="min-h-11 w-full rounded-xl border border-white/10 bg-white/[.05] px-3"
        >
          <option value="">Chọn product FILE</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>

        <Input
          className="mt-3"
          type="file"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />

        <Button className="mt-3 w-full" loading={loading} onClick={upload}>
          Upload private file
        </Button>

        {asset && (
          <div className="mt-4 rounded-xl bg-green-400/[.05] p-4 text-xs text-green-200">
            {asset.fileName ?? 'file'} • {asset.storagePath ?? 'storage path'}
            <Button className="mt-3 w-full" variant="secondary" onClick={attach}>
              Gán asset vào product
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
