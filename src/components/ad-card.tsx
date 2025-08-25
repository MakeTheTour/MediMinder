
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { Megaphone } from 'lucide-react';
import Link from 'next/link';

interface Ad {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  redirectUrl?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export function AdCard() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simplified query to avoid needing a composite index.
    const q = query(
        collection(db, 'ads'), 
        where('status', '==', 'active')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad)));
      } else {
        setAds([]);
      }
      setLoading(false);
    }, (error) => {
        console.error("Error fetching ad:", error);
        setLoading(false);
    });

    return () => unsub();
  }, []);

  const mostRecentAd = useMemo(() => {
    if (ads.length === 0) return null;
    // Sort on the client to find the most recent ad
    return [...ads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }, [ads]);

  if (loading || !mostRecentAd) {
    return null; // Don't render anything if loading or no ad is found
  }
  
  const AdContent = (
    <Card className="overflow-hidden border-primary/20 bg-primary/10 w-full hover:shadow-lg transition-shadow">
        <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-primary">
                <Megaphone className="h-4 w-4"/>
                Sponsored
            </CardTitle>
        </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="w-full sm:w-1/3">
                 <img
                    src={mostRecentAd.imageUrl}
                    alt={mostRecentAd.title}
                    width="200"
                    height="100"
                    className="rounded-md object-cover w-full h-auto"
                />
            </div>
            <div className="w-full sm:w-2/3">
                 <h3 className="font-bold text-lg text-foreground">{mostRecentAd.title}</h3>
                 <p className="text-muted-foreground">{mostRecentAd.content}</p>
            </div>
        </div>
      </CardContent>
    </Card>
  );

  if (mostRecentAd.redirectUrl) {
    return (
        <a href={mostRecentAd.redirectUrl} target="_blank" rel="noopener noreferrer" className="no-underline block">
            {AdContent}
        </a>
    )
  }

  return AdContent;
}
