import type { Response } from 'express';
import type { EntityManager } from 'typeorm';
import ExcelJS from 'exceljs';
import shortUUID from 'short-uuid';
import dataSource from '../../data-source';
import { Batches } from '../entities/batches.entity';
import { Code } from '../entities/code.entity';
import { Product } from '../entities/product.entity';
import { Company } from '../entities/company.entity';
import { ApiErrors, isDuplicateEntry } from '../errors/api-error';
import { lockRowsById } from './admin/admin-service-utils';

const CHUNK_SIZE = 1000;
const MAX_COUNT = 100000;
const VERIFY_URL_PREFIX = 'http://www.jyygds.com/?uuid=';

export class BatchService {
  private translator = shortUUID();

  private validateCount(codeCount: number): void {
    if (!Number.isInteger(codeCount) || codeCount < 1 || codeCount > MAX_COUNT) throw ApiErrors.invalid('数量必须是 1～100000 的整数');
  }

  private createChunk(manager: EntityManager, batchId: number, count: number): Code[] {
    const codes: Code[] = [];
    for (let i = 0; i < count; i += 1) {
      const uuid = this.translator.new().slice(0, 10);
      codes.push(manager.getRepository(Code).create({ batches_id: batchId, used_sum: 0, used_time: null, code_uuid: uuid, url: `${VERIFY_URL_PREFIX}${uuid}` }));
    }
    return codes;
  }

  private async saveGenerated(manager: EntityManager, batchId: number, count: number): Promise<number> {
    let inserted = 0;
    while (inserted < count) {
      const size = Math.min(CHUNK_SIZE, count - inserted);
      let saved = false;
      for (let attempt = 0; attempt < 3 && !saved; attempt += 1) {
        try { await manager.getRepository(Code).save(this.createChunk(manager, batchId, size), { chunk: CHUNK_SIZE }); saved = true; }
        catch (error) { if (!isDuplicateEntry(error) || attempt === 2) throw ApiErrors.conflict('防伪码生成冲突，请重试'); }
      }
      if (!saved) throw ApiErrors.conflict('防伪码生成冲突，请重试');
      inserted += size;
    }
    return inserted;
  }

  async createBatch(productId: number, batchName: string, codeCount: number): Promise<Batches> {
    this.validateCount(codeCount);
    return dataSource.transaction(async (manager) => {
      const [product] = await lockRowsById(manager, Product, [productId]);
      if (!product) throw ApiErrors.notFound('未找到产品');
      const batchRepository = manager.getRepository(Batches);
      if (await batchRepository.exist({ where: { product_id: productId, name: batchName } })) throw ApiErrors.conflict('同一产品下批次名称已存在');
      try {
        const batch = await batchRepository.save(batchRepository.create({ name: batchName, product_id: productId, create_time: new Date(), img_url: [], uniqueness_enforced: 1 }));
        await this.saveGenerated(manager, batch.id, codeCount);
        return batch;
      } catch (error) {
        if (error instanceof Error && error.name === 'ApiError') throw error;
        if (isDuplicateEntry(error)) throw ApiErrors.conflict('批次名称或防伪码重复');
        throw error;
      }
    });
  }

  async applyBatch(batchId: number, codeCount: number): Promise<Batches> {
    this.validateCount(codeCount);
    return dataSource.transaction(async (manager) => {
      const [batch] = await lockRowsById(manager, Batches, [batchId]);
      if (!batch) throw ApiErrors.notFound('未找到批次');
      await this.saveGenerated(manager, batchId, codeCount);
      return batch;
    });
  }

  async writeExport(batchId: number, startSerial: number, response: Response): Promise<void> {
    if (!Number.isSafeInteger(startSerial) || startSerial < 0) throw ApiErrors.invalid('起始序列号必须是大于等于 0 的整数');
    const batch = await dataSource.getRepository(Batches).createQueryBuilder('batch')
      .innerJoin(Product, 'product', 'product.id = batch.product_id').innerJoin(Company, 'company', 'company.id = product.company_id')
      .select('batch.id', 'id').addSelect('batch.name', 'name').addSelect('product.name', 'productName')
      .where('batch.id = :batchId', { batchId }).getRawOne<{ id: string; name: string; productName: string }>();
    if (!batch) throw ApiErrors.notFound('批次不存在');
    const total = await dataSource.getRepository(Code).countBy({ batches_id: batchId });
    if (!total) throw ApiErrors.invalid('当前批次没有防伪码');
    const safeName = `${batch.productName}-${batch.name}-防伪码`.replace(/[\\/:*?"<>|]/g, '_');
    response.status(200); response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); response.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(`${safeName}.xlsx`)}`);
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: response });
    const sheet = workbook.addWorksheet('防伪码');
    sheet.columns = [{ header: '校验码', key: 'codeUuid', width: 20 }, { header: '校验码网址', key: 'url', width: 42 }, { header: '序列号', key: 'serial', width: 14 }];
    let lastId = 0; let serial = startSerial;
    while (true) {
      const rows = await dataSource.getRepository(Code).createQueryBuilder('code').select(['code.id', 'code.code_uuid', 'code.url'])
        .where('code.batches_id = :batchId AND code.id > :lastId', { batchId, lastId }).orderBy('code.id', 'ASC').take(CHUNK_SIZE).getMany();
      if (!rows.length) break;
      for (const row of rows) { sheet.addRow({ codeUuid: row.code_uuid, url: row.url, serial }).commit(); serial += 1; lastId = row.id; }
    }
    sheet.commit(); await workbook.commit();
  }
}
