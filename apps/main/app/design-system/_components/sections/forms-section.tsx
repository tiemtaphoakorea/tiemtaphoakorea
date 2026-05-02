"use client";

import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@workspace/ui/components/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Separator } from "@workspace/ui/components/separator";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { useState } from "react";
import { SectionHeader } from "../section-header";
import { ShowcaseBox } from "../showcase-box";

export function FormsSection() {
  const [switchA, setSwitchA] = useState(true);
  const [switchB, setSwitchB] = useState(false);
  const [radio, setRadio] = useState("option-a");

  return (
    <>
      <SectionHeader
        num="09"
        id="forms"
        title="Forms"
        desc="Input, Select, Textarea, Switch, RadioGroup, Label. All support focus-visible rings and aria-invalid error states."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <ShowcaseBox title="input + label">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ds-email">Email address</Label>
              <Input id="ds-email" type="email" placeholder="kien@ksmart.vn" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ds-search">Search products</Label>
              <Input id="ds-search" placeholder="Type to search…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ds-disabled-input">Disabled</Label>
              <Input id="ds-disabled-input" disabled placeholder="Cannot edit" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ds-invalid-input">Error state</Label>
              <Input
                id="ds-invalid-input"
                aria-invalid="true"
                defaultValue="invalid@"
                className="border-red-300"
              />
              <p className="text-xs text-destructive">Please enter a valid email.</p>
            </div>
          </div>
        </ShowcaseBox>

        <ShowcaseBox title="select">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="skincare">Skincare</SelectItem>
                  <SelectItem value="makeup">Makeup</SelectItem>
                  <SelectItem value="fragrance">Fragrance</SelectItem>
                  <SelectItem value="haircare">Hair Care</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Size sm</Label>
              <Select>
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue placeholder="Select size…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="25">25 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </ShowcaseBox>

        <ShowcaseBox title="textarea">
          <div className="space-y-2">
            <Label htmlFor="ds-message">Message</Label>
            <Textarea
              id="ds-message"
              placeholder="Write your message here…"
              className="min-h-[100px]"
            />
          </div>
        </ShowcaseBox>

        <ShowcaseBox title="switch + radio-group">
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Toggles</Label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <Switch id="ds-s1" checked={switchA} onCheckedChange={setSwitchA} />
                  <Label htmlFor="ds-s1" className="cursor-pointer">
                    Email notifications {switchA ? "(On)" : "(Off)"}
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch id="ds-s2" checked={switchB} onCheckedChange={setSwitchB} />
                  <Label htmlFor="ds-s2" className="cursor-pointer">
                    SMS alerts {switchB ? "(On)" : "(Off)"}
                  </Label>
                </div>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Shipping method</Label>
              <RadioGroup value={radio} onValueChange={setRadio}>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="option-a" id="ds-ra" />
                  <Label htmlFor="ds-ra" className="cursor-pointer">
                    Standard (Free)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="option-b" id="ds-rb" />
                  <Label htmlFor="ds-rb" className="cursor-pointer">
                    Express (25,000₫)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="option-c" id="ds-rc" />
                  <Label htmlFor="ds-rc" className="cursor-pointer">
                    Same-day (50,000₫)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </ShowcaseBox>
      </div>
    </>
  );
}
