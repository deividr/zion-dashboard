"use client";

import { DataTable } from "@/components/data-table";
import { FullPagination } from "@/components/full-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Order } from "@/domains/order";
import { useFetchClient } from "@/lib/fetch-client";
import { useHeaderStore } from "@/stores/header-store";
import { Plus, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { columns } from "./columns";

export default function Products() {
  const router = useRouter();
  const params = useSearchParams();
  const [isLoading, setLoading] = useState(true);
  const [page, setPage] = useState(parseInt(params.get("page") || "1"));
  const [totalPage, setTotalPage] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState(params.get("search") || "");
  const { fetch } = useFetchClient();
  const setTitle = useHeaderStore((state) => state.setTitle);

  useEffect(() => {
    setTitle(["Pedidos"]);
  }, [setTitle]);

  useEffect(() => {
    setLoading(true);
    const fetchOrders = async () => {
      const data = await fetch<{
        orders: Order[];
        pagination: { total: number };
      }>(
        `${process.env.NEXT_PUBLIC_HOST_API}/orders?limit=10&page=${page}&name=${search}`
      );
      setOrders(data?.orders || []);
      setTotalPage(data?.pagination.total || 0);
      setLoading(false);
    };

    fetchOrders();
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
            placeholder="Pesquisar por número, cliente ou produto..."
            icon={Search}
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
              buildLink(1, e.target.value);
            }}
          />
        </div>
        <Button onClick={() => router.push("orders/new")}>
          <Plus /> Novo Pedido
        </Button>
      </div>
      <DataTable columns={columns} data={orders} isLoading={isLoading} />
      <FullPagination
        page={page}
        pageSize={10}
        totalCount={totalPage}
        onChangePageAction={handleChangePage}
      />
    </div>
  );
}
