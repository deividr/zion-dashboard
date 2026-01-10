"use client";

import { DataTable } from "@/components/data-table";
import { FullPagination } from "@/components/full-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Customer } from "@/domains/customer";
import { useFetchClient } from "@/lib/fetch-client";
import { useHeaderStore } from "@/stores/header-store";
import { Plus, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { columns } from "./columns";

export default function Customers() {
    const router = useRouter();
    const params = useSearchParams();
    const [isLoading, setLoading] = useState(true);
    const [page, setPage] = useState(parseInt(params.get("page") || "1"));
    const [totalPage, setTotalPage] = useState(0);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [search, setSearch] = useState(params.get("search") || "");
    const { fetch } = useFetchClient();
    const setTitle = useHeaderStore((state) => state.setTitle);

    useEffect(() => {
        setTitle(["Clientes"]);
    }, [setTitle]);

    useEffect(() => {
        setLoading(true);
        const fetchCustomers = async () => {
            const data = await fetch<{
                customers: Customer[];
                pagination: { total: number };
            }>(`${process.env.NEXT_PUBLIC_HOST_API}/customers?limit=10&page=${page}&name=${search}`);
            setCustomers(data?.customers || []);
            setTotalPage(data?.pagination.total || 0);
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

    const handleClearSearch = () => {
        setPage(1);
        setSearch("");
        buildLink(1, "");
    };

    return (
        <div className="flex flex-col gap-10">
            <div className="flex gap-10">
                <div className="grow relative">
                    <Input
                        placeholder="Pesquisar por cliente..."
                        icon={Search}
                        value={search}
                        onChange={(e) => {
                            setPage(1);
                            setSearch(e.target.value);
                            buildLink(1, e.target.value);
                        }}
                        className={search ? "pr-10" : ""}
                    />
                    {search && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-muted"
                            onClick={handleClearSearch}
                        >
                            <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    )}
                </div>
                <Button onClick={() => router.push("customers/new")}>
                    <Plus /> Novo Cliente
                </Button>
            </div>
            <DataTable columns={columns} data={customers} isLoading={isLoading} />
            <FullPagination page={page} pageSize={10} totalCount={totalPage} onChangePageAction={handleChangePage} />
        </div>
    );
}
