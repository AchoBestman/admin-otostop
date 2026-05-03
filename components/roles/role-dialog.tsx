"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useSWR from "swr";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createRoleSchema, updateRoleSchema } from "@/lib/validators/role";
import type { RoleWithPermissions, Permission } from "@/types";

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: RoleWithPermissions | null;
  onSuccess: () => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function RoleDialog({ open, onOpenChange, role, onSuccess }: RoleDialogProps) {
  const isEditing = !!role;
  
  const { data: permsData } = useSWR<{ data: Permission[] }>("/api/permissions", fetcher);
  const permissions = permsData?.data || [];

  const form = useForm({
    resolver: zodResolver(isEditing ? updateRoleSchema : createRoleSchema),
    defaultValues: {
      name: "",
      slug: "",
      permission_ids: [],
    },
  });

  React.useEffect(() => {
    if (open) {
      if (role) {
        form.reset({
          name: role.name,
          slug: role.slug,
          permission_ids: role.permissions?.map((p) => p.id) || [],
        });
      } else {
        form.reset({
          name: "",
          slug: "",
          permission_ids: [],
        });
      }
    }
  }, [open, role, form]);

  const onSubmit = async (values: any) => {
    try {
      const url = isEditing ? `/api/roles/${role.id}` : "/api/roles";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(isEditing ? "Rôle mis à jour" : "Rôle créé");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error("Erreur", { description: result.message });
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier le rôle" : "Ajouter un rôle"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Modifiez les informations du rôle et ses permissions." 
              : "Créez un nouveau rôle et assignez-lui des permissions."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du rôle</FormLabel>
                    <FormControl>
                      <Input placeholder="Administrateur" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="admin" {...field} disabled={isEditing && ["root", "admin", "customer"].includes(role?.slug || "")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormLabel>Permissions</FormLabel>
              <ScrollArea className="h-[250px] rounded-md border p-4">
                <div className="grid grid-cols-1 gap-4">
                  {permissions.map((perm) => (
                    <FormField
                      key={perm.id}
                      control={form.control}
                      name="permission_ids"
                      render={({ field }) => {
                        const permIds = (field.value as number[]) || [];
                        return (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={permIds.includes(perm.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...permIds, perm.id])
                                    : field.onChange(permIds.filter((id) => id !== perm.id));
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-medium">
                                {perm.name}
                              </FormLabel>
                              <p className="text-xs text-muted-foreground">
                                {perm.slug}
                              </p>
                            </div>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
              </ScrollArea>
              <FormMessage />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Enregistrement..." : isEditing ? "Enregistrer" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
