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
import { useToast } from "@/hooks/use-toast";
import { useFetchClient } from "@/lib/fetch-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Pencil, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Product } from "../columns";
import { formatCurrency, parseNumber } from "@/lib/utils";

const formSchema = z.object({
  value: z.string(),
  name: z.string().min(5, { message: "Nome deve ter no mínimo 5 caracteres" }),
  unityType: z.enum(["UN", "KG"], {
    message: "Tipo Unidade tem que ser UN ou KG",
  }),
});

export default function ProductDetail() {
  const { fetch } = useFetchClient();
  const router = useRouter();
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: "0.00",
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
      const data = await fetch(
        `${process.env.NEXT_PUBLIC_HOST_API}/products/${id}`
      );
      form.reset({
        value: String(data.value),
        name: data.name,
        unityType: data.unityType,
      });
      setProduct(data);
    };
    fetchProduct();
  }, [id, form, fetch]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const productUpdated: Product = {
      id: product?.id || "",
      value: parseInt(values.value),
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
      form.reset({ value: "0", name: "", unityType: "KG" });
    } else {
      form.reset({ ...productUpdated, value: productUpdated.value.toString() });
    }

    toast({
      variant: "success",
      description: `Produto ${product?.id === "new" ? "inserido" : "atualizado"}`,
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
          {product?.id !== "new" && (
            <span className="text-orange-600">{product.name}</span>
          )}
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
                    {...field}
                    value={formatCurrency(field.value)}
                    onChange={(e) => {
                      const rawValue = parseNumber(e.target.value);
                      field.onChange(rawValue);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="unityType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Unidade</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
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
