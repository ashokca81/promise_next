import { useRef, useEffect, useState, useCallback } from "react";

export default function DynamicAreaSelector({
  templateImage,
  fields,
  onFieldUpdate,
  selectedFieldIndex,
  onSelectField,
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [currentRect, setCurrentRect] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);

  const getCanvasCoordinates = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !templateImage) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw template image
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Draw all fields
      fields.forEach((field, index) => {
        const { x, y, width, height } = field.rect || {};
        if (!x && x !== 0) return;

        const isSelected = selectedFieldIndex === index;

        // Draw thicker, more visible borders
        ctx.strokeStyle = isSelected ? "#3b82f6" : "#10b981";
        ctx.lineWidth = isSelected ? 5 : 3; // Increased from 3:2 to 5:3
        ctx.setLineDash([]);
        ctx.strokeRect(x, y, width, height);

        // Draw semi-transparent fill for better visibility
        ctx.fillStyle = isSelected
          ? "rgba(59, 130, 246, 0.1)"
          : "rgba(16, 185, 129, 0.08)";
        ctx.fillRect(x, y, width, height);

        // Draw resize handles for selected field (larger and more visible)
        if (isSelected) {
          const handleSize = 14; // Increased from 8 to 14
          const handles = [
            [x, y], // top-left
            [x + width, y], // top-right
            [x, y + height], // bottom-left
            [x + width, y + height], // bottom-right
            [x + width / 2, y], // top
            [x + width / 2, y + height], // bottom
            [x, y + height / 2], // left
            [x + width, y + height / 2], // right
          ];

          handles.forEach(([hx, hy]) => {
            // White border around handles for better visibility
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(
              hx - handleSize / 2 - 1,
              hy - handleSize / 2 - 1,
              handleSize + 2,
              handleSize + 2
            );

            // Blue handle
            ctx.fillStyle = "#3b82f6";
            ctx.fillRect(
              hx - handleSize / 2,
              hy - handleSize / 2,
              handleSize,
              handleSize
            );
          });
        }

        // Draw field label with background for better visibility
        const labelText = field.column || `Field ${index + 1}`;
        ctx.font = "bold 14px Arial"; // Increased from 12px to 14px and made bold
        const textMetrics = ctx.measureText(labelText);
        const labelPadding = 4;

        // Label background
        ctx.fillStyle = isSelected ? "#3b82f6" : "#10b981";
        ctx.fillRect(
          x + 5 - labelPadding,
          y - 22 - labelPadding,
          textMetrics.width + labelPadding * 2,
          18 + labelPadding * 2
        );

        // Label text
        ctx.fillStyle = "#ffffff";
        ctx.fillText(labelText, x + 5, y - 20);
      });

      // Draw current rectangle being drawn
      if (currentRect) {
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 4; // Increased from 2 to 4
        ctx.setLineDash([8, 8]); // Increased from [5,5] to [8,8]
        ctx.strokeRect(
          currentRect.x,
          currentRect.y,
          currentRect.width,
          currentRect.height
        );

        // Add semi-transparent fill while drawing
        ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
        ctx.fillRect(
          currentRect.x,
          currentRect.y,
          currentRect.width,
          currentRect.height
        );
      }
    };
    img.src = templateImage;
  }, [templateImage, fields, selectedFieldIndex, currentRect]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleMouseDown = (e) => {
    const pos = getCanvasCoordinates(e);
    const clickedFieldIndex = fields.findIndex((field) => {
      const { x, y, width, height } = field.rect || {};
      if (!x && x !== 0) return false;

      // Increase clickable area slightly for better UX on all devices
      const hitPadding = 3;
      return (
        pos.x >= x - hitPadding &&
        pos.x <= x + width + hitPadding &&
        pos.y >= y - hitPadding &&
        pos.y <= y + height + hitPadding
      );
    });
    if (clickedFieldIndex !== -1) {
      const field = fields[clickedFieldIndex];
      const { x, y, width, height } = field.rect;

      // Check if clicking on resize handle
      const handleSize = 12;
      const handleHitArea = 18; // Larger hit area for easier clicking
      const handles = [
        { name: "tl", x: x, y: y },
        { name: "tr", x: x + width, y: y },
        { name: "bl", x: x, y: y + height },
        { name: "br", x: x + width, y: y + height },
        { name: "t", x: x + width / 2, y: y },
        { name: "b", x: x + width / 2, y: y + height },
        { name: "l", x: x, y: y + height / 2 },
        { name: "r", x: x + width, y: y + height / 2 },
      ];

      const clickedHandle = handles.find(
        (h) =>
          Math.abs(pos.x - h.x) < handleHitArea &&
          Math.abs(pos.y - h.y) < handleHitArea
      );

      if (clickedHandle) {
        setIsResizing(true);
        setResizeHandle(clickedHandle.name);
        setStartPos(pos);
        onSelectField(clickedFieldIndex);
        return;
      }

      // Start dragging
      setIsDragging(true);
      setDragOffset({
        x: pos.x - x,
        y: pos.y - y,
      });
      onSelectField(clickedFieldIndex);
      return;
    }

    // Start drawing new rectangle
    setIsDrawing(true);
    setStartPos(pos);
    onSelectField(null);
  };

  const handleMouseMove = (e) => {
    if (!startPos) return;

    const pos = getCanvasCoordinates(e);

    if (isResizing && selectedFieldIndex !== null) {
      const field = fields[selectedFieldIndex];
      const { x, y, width, height } = field.rect;
      let newRect = { ...field.rect };

      switch (resizeHandle) {
        case "tl":
          newRect = {
            x: pos.x,
            y: pos.y,
            width: width + x - pos.x,
            height: height + y - pos.y,
          };
          break;
        case "tr":
          newRect = {
            x,
            y: pos.y,
            width: pos.x - x,
            height: height + y - pos.y,
          };
          break;
        case "bl":
          newRect = {
            x: pos.x,
            y,
            width: width + x - pos.x,
            height: pos.y - y,
          };
          break;
        case "br":
          newRect = { x, y, width: pos.x - x, height: pos.y - y };
          break;
        case "t":
          newRect = { x, y: pos.y, width, height: height + y - pos.y };
          break;
        case "b":
          newRect = { x, y, width, height: pos.y - y };
          break;
        case "l":
          newRect = { x: pos.x, y, width: width + x - pos.x, height };
          break;
        case "r":
          newRect = { x, y, width: pos.x - x, height };
          break;
      }

      if (newRect.width > 10 && newRect.height > 10) {
        onFieldUpdate(selectedFieldIndex, { rect: newRect });
      }
      return;
    }

    if (isDragging && selectedFieldIndex !== null) {
      const newRect = {
        x: pos.x - dragOffset.x,
        y: pos.y - dragOffset.y,
        width: fields[selectedFieldIndex].rect.width,
        height: fields[selectedFieldIndex].rect.height,
      };
      onFieldUpdate(selectedFieldIndex, { rect: newRect });
      return;
    }

    if (isDrawing) {
      setCurrentRect({
        x: Math.min(startPos.x, pos.x),
        y: Math.min(startPos.y, pos.y),
        width: Math.abs(pos.x - startPos.x),
        height: Math.abs(pos.y - startPos.y),
      });
    }
  };

  const handleMouseUp = (e) => {
    if (
      isDrawing &&
      currentRect &&
      currentRect.width > 10 &&
      currentRect.height > 10
    ) {
      // Find first field without a rectangle
      const emptyFieldIndex = fields.findIndex(
        (f) => !f.rect || (!f.rect.x && f.rect.x !== 0)
      );
      if (emptyFieldIndex !== -1) {
        onFieldUpdate(emptyFieldIndex, { rect: currentRect });
        onSelectField(emptyFieldIndex);
      }
    }

    setIsDrawing(false);
    setIsDragging(false);
    setIsResizing(false);
    setCurrentRect(null);
    setStartPos(null);
    setDragOffset(null);
    setResizeHandle(null);
  };

  return (
    <div className="w-full border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100">
      <div className="p-4 bg-gray-200 border-b">
        <h3 className="text-sm font-medium text-gray-700">
          Draw rectangles for each field (Click and drag to create)
        </h3>
        <p className="text-xs text-gray-600 mt-1">
          🖱️ Click and drag to create | 🤚 Drag to move | ↔️ Click edges/corners
          to resize
        </p>
        <p className="text-xs text-blue-600 mt-1">
          💡 Tip: Boxes and handles are now larger for easier interaction on all
          devices
        </p>
      </div>
      <div className="overflow-auto max-h-[600px] flex justify-center p-4">
        <canvas
          ref={canvasRef}
          className="border-2 border-gray-400 cursor-crosshair max-w-full shadow-lg"
          style={{ touchAction: "none" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );
}
