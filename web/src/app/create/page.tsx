'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import { useState } from "react";

export default function CreatePage() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement NFT creation logic
    console.log('Creating NFT:', formData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Create New NFT</h1>
      <Card>
        <CardHeader>
          <CardTitle>NFT Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter NFT name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your NFT"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (ETH)</Label>
              <Input
                id="price"
                type="number"
                step="0.001"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="Enter price in ETH"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Image</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <Button type="button" variant="outline">Choose File</Button>
                </div>
                <p className="mt-2 text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>

            <Button type="submit" className="w-full">
              Create NFT
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}