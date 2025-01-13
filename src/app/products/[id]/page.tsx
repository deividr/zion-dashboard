"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Loader2, ArrowLeft, Check } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Product } from "../columns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  value: z.string(),
  name: z.string().min(5, { message: "Nome deve ter no mínimo 5 caracteres" }),
  unityType: z.enum(["UN", "KG"], {
    message: "Tipo Unidade tem que ser UN ou KG",
  }),
});

function formatCurrency(value: string) {
  const numbers = value.replace(/\D/g, "");
  const cents = Number(numbers) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents);
}

function parseCurrency(value: string) {
  return value.replace(/\D/g, "");
}

export default function ProductDetail() {
  const router = useRouter();
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
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
    const fetchProduct = async () => {
      const result = await fetch(
        `${process.env.NEXT_PUBLIC_HOST_API}/products/${id}`,
      );
      const data = await result.json();
      form.reset({
        value: String(data.value),
        name: data.name,
        unityType: data.unityType,
      });
      setProduct(data);
    };
    fetchProduct();
  }, [id, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const productUpdated: Product = {
      id: product?.id || "",
      value: parseInt(values.value),
      name: values.name,
      unityType: values.unityType,
    };

    const result = await fetch(
      `${process.env.NEXT_PUBLIC_HOST_API}/products/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(productUpdated),
      },
    );

    if (result.status !== 200) {
      console.log("Erro ao atualizar o produto");
    }

    setProduct(productUpdated);
    toast({
      variant: "success",
      description: "Produto atualizado",
    });
  };

  if (!product) return <div>Loading...</div>;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="container mx-auto flex flex-col gap-5"
      >
        <h1 className="text-2xl font-bold">
          Produto <span className="text-orange-600">{product.name}</span>
        </h1>
        <div className="grid w-full max-w-sm items-center gap-1.5">
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
        </div>
        <div className="grid w-full max-w-sm items-center gap-1.5">
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
                      const rawValue = parseCurrency(e.target.value);
                      field.onChange(rawValue);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <div className="grid w-full max-w-sm items-center gap-1.5">
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
        </div>
        <div className="flex gap-6 mt-10">
          <Button
            variant="outline"
            type="button"
            size="lg"
            onClick={() => router.back()}
          >
            <ArrowLeft />
            Voltar
          </Button>
          <Button
            variant="secondary"
            type="submit"
            size="lg"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Pencil />
            )}
            Savar
          </Button>
          <Button variant="destructive" type="button" size="lg">
            <Trash2 />
            Excluir
          </Button>
        </div>
      </form>
    </Form>
  );
}
