"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import { Trash2 } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Product } from "../columns";

export default function ProductDetail() {
  const router = useRouter();
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      const result = await fetch(
        `${process.env.NEXT_PUBLIC_HOST_API}/products/${id}`
      );
      const data = await result.json();
      setProduct(data);
    };

    fetchProduct();
  }, [id]);

  if (!product) return <div>Loading...</div>;

  return (
    <div className="container mx-auto flex flex-col gap-10">
      <h1 className="text-2xl font-bold">
        Produto <span className="text-orange-600">{product.name}</span>
      </h1>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label>Nome</Label>
        <Input value={product.name} disabled />
      </div>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label>Tipo Unidade</Label>
        <Input value={product.unityType} disabled size={10} />
      </div>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label>Valor</Label>
        <Input value={product.value} disabled />
      </div>
      <div className="flex gap-6">
        <Button variant="outline" size="lg" onClick={() => router.back()}>
          <ArrowLeft />
          Voltar
        </Button>
        <Button variant="secondary" size="lg">
          <Pencil />
          Editar
        </Button>
        <Button variant="destructive" size="lg">
          <Trash2 />
          Excluir
        </Button>
      </div>
    </div>
  );
}
