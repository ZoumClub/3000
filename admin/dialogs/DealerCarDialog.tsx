"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dealerCarSchema } from "@/lib/validations/dealerCar";
import { DealerCar } from "@/types/dealerCar";
import { MediaUpload } from "@/components/forms/sell-car/MediaUpload";
import { CarType } from "@/components/forms/dealer-car/CarType";
import { DealerInfo } from "@/components/forms/dealer-car/DealerInfo";
import { BasicInfo } from "@/components/forms/dealer-car/BasicInfo";
import { TechnicalSpecs } from "@/components/forms/dealer-car/TechnicalSpecs";
import { Features } from "@/components/forms/dealer-car/Features";
import { supabase } from "@/lib/supabase/client";
import { uploadCarMedia } from "@/lib/supabase/media";
import { toast } from "sonner";

interface DealerCarDialogProps {
  open: boolean;
  onClose: () => void;
  car?: DealerCar | null;
}

export function DealerCarDialog({ open, onClose, car }: DealerCarDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTab, setCurrentTab] = useState("dealer");

  const form = useForm({
    resolver: zodResolver(dealerCarSchema),
    defaultValues: {
      dealer_id: car?.dealer_id || "",
      brand: car?.brand || "",
      model: car?.model || "",
      year: car?.year || new Date().getFullYear(),
      price: car?.price || 0,
      mileage_range: car?.mileage_range || "",
      previous_owners: car?.previous_owners || 0,
      fuel_type: car?.fuel_type || "",
      transmission: car?.transmission || "",
      body_type: car?.body_type || "",
      exterior_color: car?.exterior_color || "",
      interior_color: car?.interior_color || "",
      features: car?.features || [],
      type: car?.type || "new",
      images: [],
      video: undefined,
    },
  });

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);

      // 1. Insert car data
      const { data: carData, error: carError } = await supabase
        .from("dealer_cars")
        .insert({
          dealer_id: data.dealer_id,
          brand: data.brand,
          model: data.model,
          year: data.year,
          price: data.price,
          mileage_range: data.mileage_range,
          previous_owners: data.previous_owners,
          fuel_type: data.fuel_type,
          transmission: data.transmission,
          body_type: data.body_type,
          exterior_color: data.exterior_color,
          interior_color: data.interior_color,
          features: data.features,
          type: data.type,
        })
        .select()
        .single();

      if (carError) throw carError;

      // 2. Upload media
      const uploadPromises = [];

      // Upload images
      if (data.images.length > 0) {
        uploadPromises.push(
          uploadCarMedia({
            carId: carData.id,
            files: data.images,
            type: "image",
          })
        );
      }

      // Upload video if exists
      if (data.video) {
        uploadPromises.push(
          uploadCarMedia({
            carId: carData.id,
            files: [data.video],
            type: "video",
          })
        );
      }

      await Promise.all(uploadPromises);
      toast.success("Car listing created successfully");
      onClose();
    } catch (error) {
      console.error("Error saving dealer car:", error);
      toast.error("Failed to save car listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {car ? "Edit Car Listing" : "Add New Car Listing"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="grid grid-cols-5">
                <TabsTrigger value="dealer">Dealer</TabsTrigger>
                <TabsTrigger value="car">Car Info</TabsTrigger>
                <TabsTrigger value="specs">Specs</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="media">Media</TabsTrigger>
              </TabsList>

              <TabsContent value="dealer">
                <DealerInfo form={form} />
              </TabsContent>

              <TabsContent value="car">
                <CarType form={form} />
                <BasicInfo form={form} />
              </TabsContent>

              <TabsContent value="specs">
                <TechnicalSpecs form={form} />
              </TabsContent>

              <TabsContent value="features">
                <Features form={form} />
              </TabsContent>

              <TabsContent value="media">
                <MediaUpload form={form} />
              </TabsContent>
            </Tabs>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const tabs = ["dealer", "car", "specs", "features", "media"];
                  const currentIndex = tabs.indexOf(currentTab);
                  if (currentIndex > 0) {
                    setCurrentTab(tabs[currentIndex - 1]);
                  }
                }}
                disabled={currentTab === "dealer" || isSubmitting}
              >
                Previous
              </Button>

              {currentTab === "media" ? (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => {
                    const tabs = ["dealer", "car", "specs", "features", "media"];
                    const currentIndex = tabs.indexOf(currentTab);
                    if (currentIndex < tabs.length - 1) {
                      setCurrentTab(tabs[currentIndex + 1]);
                    }
                  }}
                  disabled={isSubmitting}
                >
                  Next
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}