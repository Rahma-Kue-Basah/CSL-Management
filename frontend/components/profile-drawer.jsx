"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Building2, IdCard, UserCircle, GraduationCap } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLoadProfile } from "@/hooks/use-load-profile";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { useUpdateProfile } from "@/hooks/use-update-profile";
import { AlertMessage } from "@/components/ui/alert-message";
import { ChangePasswordDrawer } from "@/components/change-password-drawer";
import { Lock } from "lucide-react";
import { DEPARTMENT_OPTIONS } from "@/constants/departments";
import { BATCH_OPTIONS } from "@/constants/batches";

function InfoRow({
  icon: Icon,
  label,
  value,
  editable = false,
  editing = false,
  name,
  onChange,
  type = "text",
  options = [],
}) {
  const showSelect = editable && type === "select";
  const showInput = editable && !showSelect;
  return (
    <div className="flex items-start gap-3 rounded-md border border-border/60 px-3 py-2">
      <Icon className="mt-0.5 size-4 text-muted-foreground" />
      <div className="flex-1 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        {showSelect ? (
          <select
            name={name}
            value={value || ""}
            onChange={onChange}
            disabled={!editing}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
          >
            <option value="">Select {label.toLowerCase()}</option>
            {options.map((opt) =>
              typeof opt === "string" ? (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ) : (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ),
            )}
          </select>
        ) : showInput ? (
          <Input
            name={name}
            value={value || ""}
            onChange={onChange}
            disabled={!editing}
            placeholder={label}
            className="disabled:opacity-60"
          />
        ) : (
          <p className="text-sm font-medium">{value || "—"}</p>
        )}
      </div>
    </div>
  );
}

export function ProfileDrawer({ user, children }) {
  const { profile, initials } = useLoadProfile(user);
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [viewProfile, setViewProfile] = useState(profile);
  const [isEditing, setIsEditing] = useState(false);
  const { updateProfile, isSubmitting, message, setMessage } = useUpdateProfile();

  const roleOptions = [
    { value: "ADMIN", label: "Admin" },
    { value: "LECTURER", label: "Lecturer" },
    { value: "STUDENT", label: "Student" },
    { value: "STAFF", label: "Staff" },
    { value: "OTHER", label: "Other" },
  ];

  const toTitle = (text) =>
    text
      ? text
          .toString()
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : "-";

  const [form, setForm] = useState({
    full_name: "",
    department: "",
    batch: "",
    id_number: "",
  });

  useEffect(() => {
    setForm({
      full_name: profile.name || "",
      department: profile.department || "",
      batch: profile.batch || "",
      id_number: profile.id_number || "",
    });
    setViewProfile(profile);
  }, [profile]);

  const computedInitials = (() => {
    const source = viewProfile.name || viewProfile.email || initials || "U";
    return source
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "U";
  })();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profile.id) return;
    setMessage("");
    try {
      const updatedProfile = await updateProfile(
        profile.id,
        {
          full_name: form.full_name,
          department: form.department || null,
          batch: form.batch || null,
          id_number: form.id_number || null,
        },
        viewProfile,
      );

      setIsEditing(false);
      setViewProfile(updatedProfile);
      setForm({
        full_name: updatedProfile.name || "",
        department: updatedProfile.department || "",
        batch: updatedProfile.batch || "",
        id_number: updatedProfile.id_number || "",
      });
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Update failed");
    }
  };

  return (
    <Drawer direction="right" open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {children || (
          <Button variant="ghost" className="w-full justify-start">
            View Profile
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent
        data-full-mobile
        className={[
          "font-sans",
          "data-[vaul-drawer-direction=right]:max-w-md",
          isMobile ? "drawer-full-mobile" : "",
        ].join(" ")}
        overlayClassName="backdrop-blur-xs"
      >
        <DrawerHeader className="items-center mt-12">
          <Avatar className="h-12 w-12 rounded-xl">
            <AvatarFallback className="rounded-xl">{computedInitials}</AvatarFallback>
          </Avatar>
          <DrawerTitle className="text-xl w-full text-center">{viewProfile.name}</DrawerTitle>
          <DrawerDescription className="text-sm w-full text-center break-all whitespace-normal leading-snug">
            {viewProfile.email}
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-3 px-4 pb-4 max-h-[70vh] overflow-y-auto">
          <InfoRow
            icon={UserCircle}
            label="Name"
            value={form.full_name}
            editable
            editing={isEditing}
            name="full_name"
            onChange={handleChange}
          />
          <InfoRow
            icon={Building2}
            label="Department"
            value={form.department}
            editable
            editing={isEditing}
            name="department"
            onChange={handleChange}
            type="select"
            options={DEPARTMENT_OPTIONS}
          />
          <InfoRow
            icon={GraduationCap}
            label="Batch"
            value={form.batch}
            editable
            editing={isEditing}
            name="batch"
            onChange={handleChange}
            type="select"
            options={BATCH_OPTIONS}
          />
          <InfoRow
            icon={IdCard}
            label="ID Number"
            value={form.id_number}
            editable
            editing={isEditing}
            name="id_number"
            onChange={handleChange}
          />
          <InfoRow
            icon={BadgeCheck}
            label="Role"
            value={viewProfile.role}
            editable
            editing={false}
            name="role"
            type="select"
            options={roleOptions}
          />
          <Separator />

          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Edit Profile</p>
            <div className="flex gap-2">
              {isEditing && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              )}
              <Button
                size="sm"
                variant={isEditing ? "default" : "outline"}
                onClick={() => {
                  if (isEditing) {
                    handleSubmit(new Event("submit"));
                  } else {
                    setIsEditing(true);
                  }
                }}
                disabled={isSubmitting}
              >
                {isEditing ? (isSubmitting ? "Saving..." : "Save") : "Edit"}
              </Button>
            </div>
          </div>

          {message && (
            <AlertMessage variant={message.toLowerCase().includes("fail") ? "error" : "success"}>
              {message}
            </AlertMessage>
          )}
        </div>

        <DrawerFooter>
          {viewProfile.canResetPassword && (
            <ChangePasswordDrawer>
              <Button variant="outline" className="w-full">
                <Lock className="mr-2 h-4 w-4" />
                Ganti Password
              </Button>
            </ChangePasswordDrawer>
          )}
          <DrawerClose asChild>
            <Button variant="secondary">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default ProfileDrawer;
