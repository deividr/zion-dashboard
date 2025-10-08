import { Category, Product } from "@/domains";
import { categoryEndpoints } from "@/repository/categoryRepository";
import { productEndpoints } from "@/repository/productRepository";
import { ProductList } from "./product-list";

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { page: pageParam, search: searchParam } = await searchParams;
  const page = parseInt(pageParam || "1");
  const search = searchParam || "";

  const responseProducts = await fetch(
    `${
      process.env.NEXT_PUBLIC_HOST_API
    }${productEndpoints.list(page, search)}`,
    {
      cache: "no-cache",
    }
  );
  const dataProducts: { products: Product[]; pagination: { total: number } } =
    await responseProducts.json();

  const responseCategories = await fetch(
    `${process.env.NEXT_PUBLIC_HOST_API}${categoryEndpoints.list()}`,
    {
      cache: "no-cache",
    }
  );
  const categories: Category[] = await responseCategories.json();

  return (
    <ProductList
      products={dataProducts?.products || []}
      categories={categories || []}
      totalPage={dataProducts?.pagination.total || 0}
      page={page}
      search={search}
    />
  );
}
