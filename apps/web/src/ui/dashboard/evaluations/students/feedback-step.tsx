'use client';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import type { FeedbackStepProps } from '@/lib/@types/props';

export const FeedbackStep = ({ formData, setFormData }: FeedbackStepProps) => {
  const [sliderValue, setSliderValue] = useState(0);

  const handleSliderChange = (value: number[]) => {
    const newValue = value[0] as number;
    setSliderValue(newValue);
    setFormData('rating', newValue);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Retroalimentación</h2>
        <p className="text-muted-foreground">
          Califica tu experiencia y proporciona comentarios
        </p>
      </div>
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="rating" className="mb-6 block">
              Calificación (0-10)
            </Label>
            <div className="flex items-center space-x-4">
              <Slider
                id="rating"
                min={0}
                max={10}
                step={1}
                value={[sliderValue]}
                onValueChange={handleSliderChange}
                className="w-full"
              />
              <span className="w-12 rounded-md border border-input bg-background px-3 py-2 text-center text-sm">
                {sliderValue}
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="comments">Comentarios</Label>
          <Textarea
            className="min-h-[150px]"
            value={formData.comment}
            id="comments"
            placeholder="Comparte tus pensamientos y comentarios..."
            onChange={(e) => setFormData('comment', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
