import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function Product({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await fetch(
    `${process.env.NEXT_PUBLIC_HOST_API}/products/${id}`,
  );

  const product = await result.json();
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
    </div>
  );
}
