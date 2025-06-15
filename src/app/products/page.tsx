"use client";

import { useEffect, useState } from "react";
import { columns } from "./columns";
import { DataTable } from "../../components/data-table";
import { FullPagination } from "@/components/full-pagination";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFetchClient } from "@/lib/fetch-client";
import { useHeaderStore } from "@/stores/header-store";
import { Product } from "@/domains/product";
import { productEndpoints } from "@/repository/productRepository";
import { Category } from "@/domains";
import { categoryEndpoints } from "@/repository/categoryRepository";

export default function Products() {
  const router = useRouter();
  const params = useSearchParams();
  const [isLoading, setLoading] = useState(true);
  const [page, setPage] = useState(parseInt(params.get("page") || "1"));
  const [totalPage, setTotalPage] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState(params.get("search") || "");
  const { fetch } = useFetchClient();
  const setTitle = useHeaderStore((state) => state.setTitle);

  useEffect(() => {
    setTitle(["Produtos"]);
  }, [setTitle]);

  useEffect(() => {
    setLoading(true);
    const fetchProducts = async () => {
      const dataProducts = await fetch<{
        products: Product[];
        pagination: { total: number };
      }>(productEndpoints.list(page, search));
      const dataCategories = await fetch<{
        categories: Category[];
      }>(categoryEndpoints.list());
      setProducts(dataProducts?.products || []);
      setTotalPage(dataProducts?.pagination.total || 0);
      setCategories(dataCategories?.categories || []);
      setLoading(false);
    };

    fetchProducts();
  }, [page, search, fetch]);

  const handleChangePage = (newPage: number) => setPage(newPage);

  const buildLink = (newPage: number, newSearch: string) => {
    const query = new URLSearchParams();
    query.set("page", newPage.toString());

    if (newSearch?.length) {
      query.set("search", newSearch);
    }

    router.replace(`?${query.toString()}`);
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex gap-10">
        <div className="grow">
          <Input
            placeholder="Pesquisar por produto..."
            icon={Search}
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
              buildLink(1, e.target.value);
            }}
          />
        </div>
        <Button onClick={() => router.push("products/new")}>
          <Plus /> Novo Produto
        </Button>
      </div>
      <DataTable
        columns={columns(categories)}
        data={products}
        isLoading={isLoading}
      />
      <FullPagination
        page={page}
        pageSize={10}
        totalCount={totalPage}
        onChangePageAction={handleChangePage}
      />
    </div>
  );
}
