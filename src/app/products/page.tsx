"use client";

import { useEffect, useState } from "react";
import { Product, columns } from "./columns";
import { DataTable } from "../../components/data-table";
import { FullPagination } from "@/components/full-pagination";
import { useSearchParams } from "next/navigation";

async function getProducts({ page }: { page: number }): Promise<{
  products: Product[];
  pagination: { page: number; limit: number; total: number };
}> {
  const data = await fetch(
    `http://192.168.15.34:3000/products?limit=10&page=${page}`,
  );
  return await data.json();
}

export default function Products() {
  const params = useSearchParams();
  const [page, setPage] = useState(parseInt(params.get("page") || "1"));
  const [totalPage, setTotalPage] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    getProducts({ page }).then((data) => {
      setProducts(data.products);
      setTotalPage(data.pagination.total);
    });
  }, [page]);

  const handleChangePage = (newPage: number) => setPage(newPage);

  return (
    <div className="container mx-auto flex flex-col gap-10">
      <h1 className="text-2xl font-bold">Produtos</h1>
      <DataTable columns={columns} data={products || []} />
      <FullPagination
        page={page}
        pageSize={10}
        totalCount={totalPage}
        onChangePageAction={handleChangePage}
      />
    </div>
  );
}
