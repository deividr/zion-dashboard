import { Category } from "@/domains";
import { Product } from "@/domains/product";
import { categoryEndpoints } from "@/repository/categoryRepository";
import { productEndpoints } from "@/repository/productRepository";
import { ProductForm } from "./product-form";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let product: Product | null = null;
  if (id !== "new") {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_HOST_API}${productEndpoints.get(id)}`
    );
    product = await response.json();
  } else {
    product = {
      id: "new",
      value: 0,
      unityType: "KG",
      name: "",
      categoryId: "",
    };
  }

  const responseCategories = await fetch(
    `${process.env.NEXT_PUBLIC_HOST_API}${categoryEndpoints.list()}`
  );
  const categories: Category[] = await responseCategories.json();

  return <ProductForm product={product} categories={categories} />;
}
