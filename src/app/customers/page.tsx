"use client";

import { useEffect, useState } from "react";
import { Customer, columns } from "./columns";
import { DataTable } from "@/components/data-table";
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
  const [isLoading, setLoading] = useState(true);
  const [page, setPage] = useState(parseInt(params.get("page") || "1"));
  const [totalPage, setTotalPage] = useState(0);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState(params.get("search") || "");
  const { fetch } = useFetchClient();

  useEffect(() => {
    setLoading(true);
    const fetchCustomers = async () => {
      const data = await fetch(
        `${process.env.NEXT_PUBLIC_HOST_API}/customers?limit=10&page=${page}&name=${search}`
      );
      setCustomers(data.customers || []);
      setTotalPage(data.pagination.total);
      setLoading(false);
    };

    fetchCustomers();
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
    <div className="container m-auto flex flex-col gap-10">
      <h1 className="text-2xl font-bold">Clientes</h1>
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
        <Button variant="gradient" onClick={() => router.push("customers/new")}>
          <Plus /> Novo Cliente
        </Button>
      </div>
      <DataTable columns={columns} data={customers} isLoading={isLoading} />
      <FullPagination
        page={page}
        pageSize={10}
        totalCount={totalPage}
        onChangePageAction={handleChangePage}
      />
    </div>
  );
}
