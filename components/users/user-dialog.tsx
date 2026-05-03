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
import { createUserSchema, updateUserSchema, CreateUserInput, UpdateUserInput } from "@/lib/validators/user";
import type { SafeUser, Role } from "@/types";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: SafeUser | null;
  onSuccess: () => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function UserDialog({ open, onOpenChange, user, onSuccess }: UserDialogProps) {
  const isEditing = !!user;
  
  const { data: rolesData } = useSWR<{ data: Role[] }>("/api/roles?limit=100", fetcher);
  const roles = rolesData?.data || [];

  const form = useForm<CreateUserInput | UpdateUserInput>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      city: "",
      country: "",
      address: "",
      status: "activated",
      role_ids: [],
    },
  });

  // Reset form when user changes or dialog opens/closes
  React.useEffect(() => {
    if (open) {
      if (user) {
        form.reset({
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone || "",
          city: user.city || "",
          country: user.country || "",
          address: user.address || "",
          status: user.status as "activated" | "deactivated",
          role_ids: user.roles?.map((r) => r.id) || [],
        });
      } else {
        form.reset({
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
          city: "",
          country: "",
          address: "",
          status: "activated",
          role_ids: [],
        });
      }
    }
  }, [open, user, form]);

  const onSubmit = async (values: CreateUserInput | UpdateUserInput) => {
    try {
      const url = isEditing ? `/api/users/${user.id}` : "/api/users";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(isEditing ? "Utilisateur mis à jour" : "Utilisateur créé");
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
          <DialogTitle>{isEditing ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Modifiez les informations de l'utilisateur ci-dessous." 
              : "Remplissez les informations pour créer un nouvel utilisateur. Un email de réinitialisation sera envoyé."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom</FormLabel>
                    <FormControl>
                      <Input placeholder="Jean" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder="Dupont" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="jean.dupont@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input placeholder="+225 00000000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pays</FormLabel>
                    <FormControl>
                      <Input placeholder="Côte d'Ivoire" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormLabel>Rôles</FormLabel>
              <ScrollArea className="h-[120px] rounded-md border p-4">
                <div className="grid grid-cols-2 gap-2">
                  {roles.map((role) => (
                    <FormField
                      key={role.id}
                      control={form.control}
                      name="role_ids"
                      render={({ field }) => {
                        const roleIds = (field.value as number[]) || [];
                        return (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={roleIds.includes(role.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...roleIds, role.id])
                                    : field.onChange(roleIds.filter((id) => id !== role.id));
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              {role.name}
                            </FormLabel>
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
