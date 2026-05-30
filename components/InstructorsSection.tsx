"use client";

import { useEffect, useState } from "react";
import { getInstructors, type Instructor } from "@/lib/api";

const FALLBACK_PHOTO = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=70";

export default function InstructorsSection() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInstructors()
      .then(setInstructors)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && instructors.length === 0) return null;

  return (
    <>
      {loading ? (
        <div className="row g-3 g-md-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="col-md-4">
              <div className="fx-surface p-4 text-center">
                <div className="skeleton-pulse rounded-circle mx-auto mb-3" style={{ width: 88, height: 88 }} />
                <div className="skeleton-pulse rounded mx-auto mb-2" style={{ width: "55%", height: 18 }} />
                <div className="skeleton-pulse rounded mx-auto mb-2" style={{ width: "40%", height: 14 }} />
                <div className="skeleton-pulse rounded mx-auto" style={{ width: "80%", height: 12 }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="row g-3 g-md-4 justify-content-center">
          {instructors.map((inst) => (
            <div key={inst.id} className="col-md-6 col-lg-4">
              <div className="fx-surface p-4 h-100 text-center">
                <img
                  src={inst.photoUrl || FALLBACK_PHOTO}
                  alt={inst.name}
                  className="rounded-circle mb-3 object-fit-cover"
                  style={{ width: 88, height: 88, border: "3px solid rgba(255,59,48,0.4)" }}
                  onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_PHOTO; }}
                />
                <h5 className="fw-bold mb-1">{inst.name}</h5>
                {inst.specialty && (
                  <span
                    className="badge mb-2"
                    style={{ background: "rgba(255,59,48,0.15)", color: "var(--fx-accent)", fontWeight: 600 }}
                  >
                    {inst.specialty}
                  </span>
                )}
                {inst.bio && (
                  <p className="fx-muted small mb-0 mt-1" style={{ lineHeight: 1.6 }}>
                    {inst.bio}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
