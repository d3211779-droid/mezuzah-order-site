"use client";

import { useState } from "react";
import { models, colors } from "@/data/catalog";

export default function OrderBuilder() {
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [selectedColor, setSelectedColor] = useState(colors.find(c => c.available) || colors[0]);
  const [fillType, setFillType] = useState("none");
  const [personalText, setPersonalText] = useState("");

  const maxChars = 15;

  return (
    <section className="px-4 pb-16">
      <div className="space-y-8">

        <div className="rounded-3xl bg-white border border-[#E8DDCA] p-5 md:p-7 shadow-sm">
          <div className="mb-5">
            <span className="text-sm text-[#A1824A] font-medium">שלב 1</span>
            <h2 className="text-2xl font-bold mt-1">בחרו דגם</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {models.map((model) => {
              const isSelected = selectedModel.id === model.id;

              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => setSelectedModel(model)}
                  className={`overflow-hidden rounded-2xl border-2 text-right transition ${
                    isSelected
                      ? "border-[#B28B49] shadow-md"
                      : "border-[#E8DDCA] hover:border-[#CDBA99]"
                  }`}
                >
                  <div className="aspect-[4/5] bg-[#EEE7DB]">
                    <img
                      src={model.image}
                      alt={model.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>

                  <div className="p-4 flex items-center justify-between">
                    <span className="font-semibold">{model.name}</span>
                    {isSelected && (
                      <span className="text-[#A1824A] text-sm font-medium">
                        נבחר
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-[#E8DDCA] p-5 md:p-7 shadow-sm">
          <div className="mb-5">
            <span className="text-sm text-[#A1824A] font-medium">שלב 2</span>
            <h2 className="text-2xl font-bold mt-1">בחרו צבע</h2>
          </div>

          <div className="flex flex-wrap gap-4">
            {colors.map((color) => {
              const isSelected = selectedColor?.id === color.id;

              return (
                <button
                  key={color.id}
                  type="button"
                  disabled={!color.available}
                  onClick={() => color.available && setSelectedColor(color)}
                  className={`flex flex-col items-center gap-2 min-w-[70px] ${
                    !color.available ? "opacity-40 cursor-not-allowed" : ""
                  }`}
                >
                  <span
                    className={`w-12 h-12 rounded-full border-2 ${
                      isSelected
                        ? "border-[#B28B49] ring-2 ring-[#E7D6B6]"
                        : "border-[#D7CEC0]"
                    }`}
                    style={{ backgroundColor: color.hex }}
                  />

                  <span className="text-sm">{color.name}</span>

                  {!color.available && (
                    <span className="text-xs text-gray-400">לא זמין</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-[#E8DDCA] p-5 md:p-7 shadow-sm">
          <div className="mb-5">
            <span className="text-sm text-[#A1824A] font-medium">שלב 3</span>
            <h2 className="text-2xl font-bold mt-1">בחרו מילוי</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ["none", "ללא מילוי"],
              ["single", "צבע אחד"],
              ["double", "שני צבעים"],
              ["pattern", "דוגמה"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFillType(value)}
                className={`rounded-xl border px-4 py-3 font-medium transition ${
                  fillType === value
                    ? "border-[#B28B49] bg-[#FBF6ED]"
                    : "border-[#E8DDCA] hover:border-[#CDBA99]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-[#E8DDCA] p-5 md:p-7 shadow-sm">
          <div className="mb-5">
            <span className="text-sm text-[#A1824A] font-medium">שלב 4</span>
            <h2 className="text-2xl font-bold mt-1">טקסט אישי</h2>
            <p className="mt-2 text-sm text-[#756A61]">
              אפשר להוסיף שם או ברכה קצרה בעברית.
            </p>
          </div>

          <input
            type="text"
            dir="rtl"
            value={personalText}
            onChange={(e) => {
              const value = e.target.value;

              if (value.length <= maxChars) {
                setPersonalText(value);
              }
            }}
            placeholder="לדוגמה: משפחת כהן"
            className="w-full rounded-xl border border-[#DCCFBD] bg-[#FFFDF9] px-4 py-3 outline-none focus:border-[#B28B49]"
          />

          <div className="mt-2 flex justify-between text-xs text-[#8B8177]">
            <span>עד {maxChars} תווים</span>
            <span>
              {personalText.length}/{maxChars}
            </span>
          </div>
        </div>

        <div className="rounded-3xl bg-[#3C3028] text-white p-5 md:p-7">
          <p className="text-sm text-[#D9C39A] mb-2">סיכום הבחירה</p>

          <div className="space-y-2">
            <p>
              <strong>דגם:</strong> {selectedModel.name}
            </p>

            <p>
              <strong>צבע:</strong> {selectedColor?.name}
            </p>

            <p>
              <strong>מילוי:</strong>{" "}
              {
                {
                  none: "ללא מילוי",
                  single: "צבע אחד",
                  double: "שני צבעים",
                  pattern: "דוגמה",
                }[fillType]
              }
            </p>

            {personalText && (
              <p>
                <strong>טקסט:</strong> {personalText}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
