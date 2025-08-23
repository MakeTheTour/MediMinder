
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import Image from 'next/image';
import { Megaphone } from 'lucide-react';
import Link from 'next/link';

interface Ad {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  redirectUrl?: string;
}

export function AdCard() {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'ads'), orderBy('createdAt', 'desc'), limit(1));
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setAd({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Ad);
      } else {
        setAd(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading || !ad) {
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
                 <Image
                    src={ad.imageUrl}
                    alt={ad.title}
                    width={200}
                    height={100}
                    className="rounded-md object-cover w-full h-auto"
                />
            </div>
            <div className="w-full sm:w-2/3">
                 <h3 className="font-bold text-lg text-foreground">{ad.title}</h3>
                 <p className="text-muted-foreground">{ad.content}</p>
            </div>
        </div>
      </CardContent>
    </Card>
  );

  if (ad.redirectUrl) {
    return (
        <a href={ad.redirectUrl} target="_blank" rel="noopener noreferrer" className="no-underline block">
            {AdContent}
        </a>
    )
  }

  return AdContent;
}

