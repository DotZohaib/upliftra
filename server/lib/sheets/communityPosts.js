// server/lib/sheets/communityPosts.js
import { getSheetData, findRowByField, appendRow, updateRowById,
  deleteRowByDataIndex, getSheetId, generateId } from './helpers.js';
const SHEET = 'CommunityPosts';
export const CPOST_HEADERS = ['id','authorId','authorName','authorAvatar','authorRole',
  'postType','content','tags','upvotes','commentsCount','createdAt','comments',
  'isHidden','isPinned','reportsCount'];
export async function getCommunityPosts(filters = {}) {
  let rows = await getSheetData(SHEET, 30000);
  if (!filters.includeHidden) rows = rows.filter(r => !r.isHidden);
  return rows;
}
export async function getCommunityPostById(id) {
  const { row } = await findRowByField(SHEET, 'id', id, 0); return row;
}
export async function createCommunityPost(post) {
  const n = { ...post, id: generateId('POST'), upvotes: 1, commentsCount: 0,
    createdAt: new Date().toISOString(), comments: [], isHidden: false, reportsCount: 0 };
  await appendRow(SHEET, n); return n;
}
export async function updateCommunityPost(id, updates) { return updateRowById(SHEET, id, updates); }
export async function deleteCommunityPost(id) {
  const rows = await getSheetData(SHEET, 0);
  const idx  = rows.findIndex(r => r.id === id);
  if (idx === -1) return false;
  return deleteRowByDataIndex(SHEET, idx, await getSheetId(SHEET));
}
export async function toggleUpvote(postId, userId) {
  const { row } = await findRowByField(SHEET, 'id', postId, 0);
  if (!row) return null;
  const upvotes = (row.upvotes || 0) + 1;
  await updateRowById(SHEET, postId, { upvotes });
  return { upvotes };
}
export async function addComment(postId, comment) {
  const { row } = await findRowByField(SHEET, 'id', postId, 0);
  if (!row) return null;
  const comments = Array.isArray(row.comments) ? row.comments : [];
  const newComment = { id: generateId('CMT'), ...comment, createdAt: new Date().toISOString() };
  comments.push(newComment);
  await updateRowById(SHEET, postId, { comments, commentsCount: comments.length });
  return newComment;
}
