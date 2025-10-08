import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface FiltersBarProps {
  onPriceChange?: (value: number[]) => void;
  onDistanceChange?: (value: number[]) => void;
  onRefundableChange?: (checked: boolean) => void;
  onBoardChange?: (value: string) => void;
  onStarsChange?: (value: string) => void;
}

export function FiltersBar({
  onPriceChange,
  onDistanceChange,
  onRefundableChange,
  onBoardChange,
  onStarsChange,
}: FiltersBarProps) {
  return (
    <div className="bg-slate-50 border-b border-slate-200 py-6">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Smart Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          
          {/* Price Range - Disabled */}
          <div className="space-y-2 opacity-50">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Price Range</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-slate-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Coming soon</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Slider 
              disabled 
              defaultValue={[0, 500]} 
              max={1000} 
              step={10}
              className="cursor-not-allowed"
              data-testid="slider-price"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>$0</span>
              <span>$1000+</span>
            </div>
          </div>

          {/* Distance to Venue - Disabled */}
          <div className="space-y-2 opacity-50">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Distance (km)</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-slate-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Coming soon</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Slider 
              disabled 
              defaultValue={[0, 10]} 
              max={20} 
              step={1}
              className="cursor-not-allowed"
              data-testid="slider-distance"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>0 km</span>
              <span>20 km+</span>
            </div>
          </div>

          {/* Refundable Toggle - Disabled */}
          <div className="space-y-2 opacity-50">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Refundable Only</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-slate-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Coming soon</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Switch 
              disabled 
              className="cursor-not-allowed"
              data-testid="switch-refundable"
            />
          </div>

          {/* Board Type - Disabled */}
          <div className="space-y-2 opacity-50">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Board Type</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-slate-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Coming soon</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select disabled>
              <SelectTrigger className="cursor-not-allowed" data-testid="select-board">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="bb">Bed & Breakfast</SelectItem>
                <SelectItem value="hb">Half Board</SelectItem>
                <SelectItem value="fb">Full Board</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Star Rating - Disabled */}
          <div className="space-y-2 opacity-50">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Star Rating</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-slate-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Coming soon</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select disabled>
              <SelectTrigger className="cursor-not-allowed" data-testid="select-stars">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="3">3+ Stars</SelectItem>
                <SelectItem value="4">4+ Stars</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>
      </div>
    </div>
  );
}
