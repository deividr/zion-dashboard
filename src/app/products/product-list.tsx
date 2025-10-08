"use client";

import { FullPagination } from "@/components/full-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Category, Product } from "@/domains";
import { useHeaderStore } from "@/stores/header-store";
import { Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DataTable } from "../../components/data-table";
import { columns } from "./columns";

interface ProductListProps {
  products: Product[];
  categories: Category[];
  totalPage: number;
  page: number;
  search: string;
}

export function ProductList({
  products,
  categories,
  totalPage,
  page: initialPage,
  search: initialSearch,
}: ProductListProps) {
  const router = useRouter();
  const [page, setPage] = useState(initialPage);
  const [search, setSearch] = useState(initialSearch);
  const setTitle = useHeaderStore((state) => state.setTitle);

  useEffect(() => {
    setTitle(["Produtos"]);
  }, [setTitle]);

  const buildLink = (newPage: number, newSearch: string) => {
    const query = new URLSearchParams();
    query.set("page", newPage.toString());

    if (newSearch?.length) {
      query.set("search", newSearch);
    }

    router.replace(`/products?${query.toString()}`);
  };

  const handleSearchChange = (value: string) => {
    const newPage = 1;
    setPage(newPage);
    setSearch(value);
    buildLink(newPage, value);
  };

  const handleChangePage = (newPage: number) => {
    setPage(newPage);
    buildLink(newPage, search);
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex gap-10">
        <div className="grow">
          <Input
            placeholder="Pesquisar por produto..."
            icon={Search}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <Button onClick={() => router.push("products/new")}>
          <Plus /> Novo Produto
        </Button>
      </div>
      <DataTable
        columns={columns(categories)}
        data={products}
        isLoading={false}
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
