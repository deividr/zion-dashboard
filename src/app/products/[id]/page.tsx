"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectValue,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Product, productSchema, UnityType } from "@/domains/product";
import { useToast } from "@/hooks/use-toast";
import { useFetchClient } from "@/lib/fetch-client";
import { formatCurrency, parseNumber } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Pencil, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

export default function ProductDetail() {
  const { fetch } = useFetchClient();
  const router = useRouter();
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const form = useForm<Product>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      id: undefined,
      value: 0,
      name: "",
      unityType: "KG",
    },
  });

  useEffect(() => {
    if (id === "new") {
      setProduct({ id: "new", value: 0, unityType: "KG", name: "" });
      return;
    }

    const fetchProduct = async () => {
      const data = await fetch<Product>(
        `${process.env.NEXT_PUBLIC_HOST_API}/products/${id}`
      );
      form.reset({
        id: data?.id,
        value: data?.value,
        name: data?.name,
        unityType: data?.unityType,
      });
      setProduct(data);
    };
    fetchProduct();
  }, [id, form, fetch]);

  const onSubmit = async (values: Product) => {
    const productUpdated: Product = {
      id: product?.id || "",
      value: values.value,
      name: values.name,
      unityType: values.unityType,
    };

    const url =
      product?.id === "new"
        ? `${process.env.NEXT_PUBLIC_HOST_API}/products`
        : `${process.env.NEXT_PUBLIC_HOST_API}/products/${id}`;

    const method = product?.id === "new" ? "POST" : "PUT";

    await fetch(url, {
      method,
      body: JSON.stringify(productUpdated),
    });

    setProduct(productUpdated);

    if (product?.id === "new") {
      form.reset({ value: 0, name: "", unityType: "KG" });
    } else {
      form.reset({ ...productUpdated, value: productUpdated.value });
    }

    toast({
      variant: "success",
      description: `Produto ${
        product?.id === "new" ? "inserido" : "atualizado"
      }`,
    });
  };

  const handleDelete = async () => {
    setLoading(true);

    await fetch(`${process.env.NEXT_PUBLIC_HOST_API}/products/${id}`, {
      method: "DELETE",
    });

    toast({
      variant: "success",
      description: "Produto excluído com sucesso",
    });

    router.back();
  };

  if (!product) return <div>Loading...</div>;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="container mx-auto flex flex-col gap-5"
      >
        <h1 className="text-2xl font-bold">
          {product?.id !== "new" && <span>{product.name}</span>}
        </h1>
        <div className="grid w-full max-w-sm items-center gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor</FormLabel>
                <FormControl>
                  <Input
                    inputMode="numeric"
                    {...field}
                    value={formatCurrency(field.value.toString())}
                    onChange={(e) => {
                      console.log(form.getValues());
                      const rawValue = parseInt(parseNumber(e.target.value));
                      field.onChange(rawValue);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="unityType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Unidade</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de unidade do produto" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.keys(UnityType).map((key) => (
                      <SelectItem key={key} value={key}>
                        {UnityType[key as keyof typeof UnityType]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-between gap-4 mt-5">
            <Button
              className="flex-1"
              variant="ghost"
              type="button"
              onClick={() => router.back()}
            >
              <ArrowLeft />
              Voltar
            </Button>
            <Button
              className="flex-1"
              variant="secondary"
              type="submit"
              disabled={[
                form.formState.isSubmitting,
                !form.formState.isDirty,
              ].includes(true)}
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Pencil />
              )}
              {product?.id === "new" ? "Adicionar" : "Savar"}
            </Button>
            {product.id !== "new" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="flex-1"
                    variant="destructive"
                    type="button"
                    disabled={loading}
                  >
                    <Trash2 />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Tem certeza que quer excluir esse produto?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Essa ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Button
                        variant="destructive"
                        type="button"
                        onClick={handleDelete}
                        disabled={loading}
                      >
                        Continuar
                      </Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}
