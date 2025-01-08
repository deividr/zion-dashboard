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

async function getProducts({
  page,
  search,
}: {
  page: number;
  search: string;
}): Promise<{
  products: Product[];
  pagination: { page: number; limit: number; total: number };
}> {
  const data = await fetch(
    `${process.env.NEXT_PUBLIC_HOST_API}/products?limit=10&page=${page}&name=${search}`,
  );
  return await data.json();
}

export default function Products() {
  const router = useRouter();
  const params = useSearchParams();
  const [page, setPage] = useState(parseInt(params.get("page") || "1"));
  const [totalPage, setTotalPage] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState(params.get("search") || "");

  useEffect(() => {
    getProducts({ page, search }).then((data) => {
      setProducts(data.products || []);
      setTotalPage(data.pagination.total);
    });
  }, [page, search]);

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
        <Button>
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
