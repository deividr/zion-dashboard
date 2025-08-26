"use client";

import Calendar23 from "@/components/calendar-23";
import { DataTable } from "@/components/data-table";
import { FullPagination } from "@/components/full-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Order } from "@/domains/order";
import { useFetchClient } from "@/lib/fetch-client";
import { useHeaderStore } from "@/stores/header-store";
import { addDays } from "date-fns";
import { Plus, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { columns } from "./columns";
import { DateRange } from "react-day-picker";

export default function Products() {
    const router = useRouter();
    const params = useSearchParams();
    const pickupStartParam = params.get("pickupStart");
    const pickupEndParam = params.get("pickupEnd");
    const [isLoading, setLoading] = useState(true);
    const [page, setPage] = useState(parseInt(params.get("page") || "1"));
    const [search, setSearch] = useState(params.get("search") || "");
    const [pickupStart, setPickupStart] = useState<Date>(
        pickupStartParam ? new Date(pickupStartParam) : new Date()
    );
    const [pickupEnd, setPickupEnd] = useState<Date>(
        pickupEndParam ? new Date(pickupEndParam) : addDays(new Date(), 10)
    );
    const [totalPage, setTotalPage] = useState(0);
    const [orders, setOrders] = useState<Order[]>([]);
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
                `${process.env.NEXT_PUBLIC_HOST_API}/orders?pickupDateStart=${pickupStart.toISOString()}&pickupDateEnd=${pickupEnd.toISOString()}&limit=10&page=${page}&search=${search}`
            );
            setOrders(data?.orders || []);
            setTotalPage(data?.pagination.total || 0);
            setLoading(false);
        };

        fetchOrders();
    }, [page, search, pickupStart, pickupEnd, fetch]);

    const handleChangePage = (newPage: number) => setPage(newPage);
    const handleChangePickup = (range?: DateRange) => {
        setPickupStart(range?.from ?? new Date());
        setPickupEnd(range?.to ?? new Date());
    };

    const buildLink = (newPage: number, newSearch: string) => {
        const query = new URLSearchParams();
        query.set("page", newPage.toString());
        query.set("pickupStart", newPage.toString());

        if (newSearch?.length) {
            query.set("search", newSearch);
        }

        router.replace(`?${query.toString()}`);
    };

    return (
        <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-4 md:flex-row md:gap-10">
                <Button
                    onClick={() => router.push("orders/new")}
                    className="md:order-3"
                >
                    <Plus /> Novo Pedido
                </Button>
                <div className="grow md:order-1">
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
                <div className="md:order-2">
                    <Calendar23
                        range={{ from: pickupStart, to: pickupEnd }}
                        onSelect={handleChangePickup}
                    />
                </div>
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
