
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase-client';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { AdherenceLog, UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pill, PackageX, Calendar } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

function ReportItem({ log }: { log: AdherenceLog }) {
    const statusVariant = log.status === 'missed' ? 'destructive' : 'secondary';
    const statusText = log.status === 'missed' ? 'Missed Dose' : 'Stock Out';
    const StatusIcon = log.status === 'missed' ? Pill : PackageX;
    return (
        <div className="flex items-start gap-4 p-4 border-b">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                 <StatusIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-grow">
                <div className="flex items-center justify-between">
                    <p className="font-semibold">{log.reminderContent}</p>
                    <Badge variant={statusVariant}>{statusText}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                    {format(new Date(log.takenAt), 'PPPPp')}
                </p>
            </div>
        </div>
    );
}

export default function FamilyMemberReportPage() {
    const { user, isGuest } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const memberId = params.memberId as string;

    const [memberProfile, setMemberProfile] = useState<UserProfile | null>(null);
    const [reportLogs, setReportLogs] = useState<AdherenceLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || isGuest || !memberId) {
            router.push('/family');
            return;
        }

        setLoading(true);

        const fetchMemberProfile = async () => {
            const memberDocRef = doc(db, 'users', memberId);
            const memberDocSnap = await getDoc(memberDocRef);
            if (memberDocSnap.exists()) {
                setMemberProfile(memberDocSnap.data() as UserProfile);
            } else {
                toast({ title: "Error", description: "Family member not found.", variant: "destructive" });
                router.push('/family');
            }
        };

        fetchMemberProfile();

        const sevenDaysAgo = startOfDay(subDays(new Date(), 7));
        const logsQuery = query(
            collection(db, 'users', memberId, 'adherenceLogs'),
            where('takenAt', '>=', sevenDaysAgo.toISOString()),
            where('status', 'in', ['missed', 'stock_out'])
        );
        
        const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
            const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdherenceLog))
                .sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.createdAt).getTime());
            setReportLogs(logs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching adherence logs:", error);
            toast({ title: "Error", description: "Could not fetch report data.", variant: "destructive" });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, isGuest, memberId, router, toast]);

    return (
        <div className="container mx-auto max-w-2xl p-4">
            <header className="mb-6 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/family')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                {memberProfile ? (
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={memberProfile.photoURL} alt={memberProfile.name}/>
                            <AvatarFallback>{memberProfile.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                             <h1 className="text-2xl font-bold">{memberProfile.name}'s Report</h1>
                             <p className="text-muted-foreground">Last 7 days adherence</p>
                        </div>
                    </div>
                ) : (
                    <h1 className="text-2xl font-bold">Adherence Report</h1>
                )}
            </header>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5"/>
                        Missed Doses & Stock Outs
                    </CardTitle>
                    <CardDescription>
                        A log of all missed or out-of-stock medication events from the past week.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="text-center p-10 text-muted-foreground">Loading report...</div>
                    ) : reportLogs.length > 0 ? (
                        <div className="space-y-0">
                            {reportLogs.map(log => <ReportItem key={log.id} log={log} />)}
                        </div>
                    ) : (
                        <div className="text-center p-10">
                            <p className="text-muted-foreground">No missed doses or stock-outs reported in the last 7 days. Great job!</p>
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
    );
}
