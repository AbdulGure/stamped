'use client';
import { usePassport } from '@/features/stamps/use-passport';
import Link from 'next/link';
import { ArrowUpRight, Clock, MapPin, Bookmark } from 'lucide-react';
import type { Experience } from '@/types';
export function ExperienceCard({experience}:{experience:Experience}) {const {stamps}=usePassport();const completed=stamps.some(s=>s.experienceId===experience.id);return <Link className="experience-card" href={`/experience/${experience.id}`}><div className="card-photo"><img src={experience.image} alt={experience.imageAlt} loading="lazy"/><span className={`category-tag ${experience.category.toLowerCase()}`}>{experience.category}</span><span className="card-arrow"><ArrowUpRight size={23}/></span></div><div className="card-copy"><span className="card-location"><MapPin size={13}/> TOKYO, JAPAN</span><h3>{experience.title}</h3><p><Clock size={14}/>{completed?'✓ Stamped':experience.duration}<span>·</span>{experience.cost}</p></div><Bookmark className="row-bookmark" size={19} aria-hidden="true"/></Link>}
