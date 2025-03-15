"use client";

import { useEffect, useState } from "react";
import { Product, columns } from "./columns";
import { DataTable } from "../../components/data-table";
import { FullPagination } from "@/components/full-pagination";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFetchClient } from "@/lib/fetch-client";

export default function Products() {
  const router = useRouter();
  const params = useSearchParams();
  const [page, setPage] = useState(parseInt(params.get("page") || "1"));
  const [totalPage, setTotalPage] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState(params.get("search") || "");
  const { fetch } = useFetchClient();

  useEffect(() => {
    const fetchProducts = async () => {
      console.log("valor do NEXT_PUBLIC_HOST_API", process.env.NEXT_PUBLIC_HOST_API);
      const data = await fetch(
        `${process.env.NEXT_PUBLIC_HOST_API}/products?limit=10&page=${page}&name=${search}`,
      );
      setProducts(data.products || []);
      setTotalPage(data.pagination.total);
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
    <div className="container mx-auto flex flex-col gap-10">
      <h1 className="text-2xl font-bold">Produtos</h1>
      <div className="flex gap-10">
        <div className="grow">
          <Input
            placeholder="Pesquisar por nome..."
            icon={Search}
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
              buildLink(1, e.target.value);
            }}
          />
        </div>
        <Button variant="gradient" onClick={() => router.push("products/new")}>
          <Plus /> Novo Produto
        </Button>
      </div>
      <DataTable columns={columns} data={products} />
      <FullPagination
        page={page}
        pageSize={10}
        totalCount={totalPage}
        onChangePageAction={handleChangePage}
      />
    </div>
  );
}
